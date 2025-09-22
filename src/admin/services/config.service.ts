import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AdminConfigError, HoloConfig, HoloConfigAction, HoloConfigType} from "../types";
import logger from "../../utils/logger";
import {HoloConfigValidator} from "../validators";
import {ArkErrors} from "arktype";
import {EventEmitter} from "events";
import {TokenService} from "./token.service";
import {OrganizationCacheService} from "./organization.cache.service";

@injectable()
export class ConfigService extends EventEmitter {

    private initialized: boolean = false;

    constructor(
        private tokenService: TokenService,
        private organizationCacheService: OrganizationCacheService
    ) {
        super();
    }

    async processConfig(holoConfig: HoloConfig): Promise<void> {

        logger.info(`Processing config: ${holoConfig.configType} with ${holoConfig.data.length} entries`);
        const config = await this.validateConfig(holoConfig);

        try {
            if (config instanceof ArkErrors) {
                const msg = `Invalid Holo Config ${JSON.stringify(config.summary, null, 2)}`;
                this.emit('config:error', new AdminConfigError(msg, config));
            } else {
                if (!this.initialized && holoConfig.action != HoloConfigAction.NEW) {
                    logger.warn(`Config is not initialized, ignoring config ${JSON.stringify(config, null, 2)}`);
                } else {
                    switch (config.configType) {
                        case HoloConfigType.JWT_TOKEN:
                            this.tokenService.applyConfig(config);
                            break;
                        case HoloConfigType.ORGANIZATION:
                            this.organizationCacheService.applyConfig(config);
                            break;
                        case HoloConfigType.APPLICATION:
                            break;
                    }

                    this.emit(this.initialized ? 'config:update' : 'config:initial', config);
                    if (!this.initialized) {
                        this.initialized = true;
                    }
                }
            }
        } catch (error) {
            this.emit('config:error', error);
        }

    }

    async validateConfig(config: HoloConfig): Promise<HoloConfig | ArkErrors> {
        return HoloConfigValidator(config as HoloConfig);
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}
