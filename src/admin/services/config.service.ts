import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloConfig, HoloConfigAction, HoloConfigType} from "../../cache";
import logger from "../../utils/logger";
import {HoloConfigValidator} from "../validators";
import {ArkErrors} from "arktype";
import {EventEmitter} from "events";
import {AdminConfigError} from "../types";
import {TokenService} from "./token.service";

@injectable()
export class ConfigService extends EventEmitter {

    private initialized: boolean = false;

    constructor(
        private tokenService: TokenService,
    ) {
        super();
    }

    async processConfig(holoConfig: HoloConfig): Promise<void> {

        logger.info(`Processing config: ${holoConfig.configType} with ${holoConfig.data.length} entries`);
        const config = await this.validateConfig(holoConfig);

        if (config instanceof ArkErrors) {
            throw new AdminConfigError('Invalid Holo Config', config);
        } else {
            if (!this.initialized && holoConfig.action != HoloConfigAction.NEW) {
                logger.warn(`Config is not initialized, ignoring config ${JSON.stringify(holoConfig, null, 2)}`);
            }

            switch (config.configType) {
                case HoloConfigType.JWT_TOKEN:
                    this.tokenService.applyConfig(config);
                    break;
                case HoloConfigType.ORGANIZATION:
                    break;
                case HoloConfigType.APPLICATION:
                    break;
            }
        }
    }

    async validateConfig(config: HoloConfig): Promise<HoloConfig | ArkErrors> {
        return HoloConfigValidator(config as HoloConfig);
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}
