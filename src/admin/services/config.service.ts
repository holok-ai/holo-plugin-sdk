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
        this.setMaxListeners(5);
    }

    async processConfig(holoConfig: HoloConfig): Promise<boolean> {

        logger.info(`Processing config: ${holoConfig.configType} with ${holoConfig.data.length} entries`);
        const config = await this.validateConfig(holoConfig);

        try {
            if (config instanceof ArkErrors) {
                const msg = `Invalid Holo Config ${JSON.stringify(config.summary, null, 2)}`;
                logger.error(msg);
                this.emit('config:error', new AdminConfigError(msg, config));
                return false;
            } else {
                if (!this.initialized && holoConfig.action != HoloConfigAction.NEW) {
                    logger.warn(`Config is not initialized, ignoring config ${JSON.stringify(config, null, 2)}`);
                } else {
                    // logger.debug(`Processing config: ${JSON.stringify(config, null, 2)}`);
                    switch (config.configType) {
                        case HoloConfigType.JWT_TOKEN:
                            this.tokenService.applyConfig(config);
                            break;
                        case HoloConfigType.ORGANIZATION:
                            this.organizationCacheService.applyConfig(config);
                            break;
                        case HoloConfigType.APPLICATION:
                            this.organizationCacheService.applyApplicationConfig(config);
                            break;
                    }

                    this.emit(this.initialized ? 'config:updated' : 'config:initialized', config);
                    if (!this.initialized) {
                        this.initialized = true;
                    }
                    return true;
                }
            }
        } catch (error) {
            logger.error(`Error processing config: ${(error as Error).message}`);
            this.emit('config:error', error);
            return false;
        }
        return false;
    }

    async validateConfig(config: HoloConfig): Promise<HoloConfig | ArkErrors> {
        return HoloConfigValidator(config as HoloConfig);
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}
