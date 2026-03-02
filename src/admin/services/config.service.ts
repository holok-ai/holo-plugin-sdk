import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AdminConfigError} from "../types";
import logger from "../../utils/logger";
import {HoloConfigValidator} from "../validators";
import {ArkErrors} from "arktype";
import {EventEmitter} from "events";
import {TokenService} from "./token.service";
import {OrganizationConfigCacheService} from "./organization.config.cache.service";
import {HoloConfig, HoloConfigAction, HoloConfigType} from "@holokai/sdk";

@injectable()
export class ConfigService extends EventEmitter {

    private initialized: boolean = false;

    constructor(
        private tokenService: TokenService,
        private organizationCacheService: OrganizationConfigCacheService
    ) {
        super();
        this.setMaxListeners(5);
    }

    async processConfig(holoConfig: HoloConfig): Promise<boolean> {

        logger.info(`Processing config: ${holoConfig.configType} with ${holoConfig.data.length} entries`);

        // Transform old format to new format before validation
        const transformedConfig = this.transformConfig(holoConfig);

        const config = await this.validateConfig(transformedConfig);

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

    private transformConfig(config: HoloConfig): HoloConfig {
        // Only transform ORGANIZATION and APPLICATION configs
        if (config.configType !== HoloConfigType.ORGANIZATION && config.configType !== HoloConfigType.APPLICATION) {
            return config;
        }

        const transformedData = config.data.map((item: any) => {
            if (item.applications) {
                // ORGANIZATION config - transform nested applications
                return {
                    ...item,
                    applications: item.applications.map((app: any) => {
                        if (!app.providerName && app.providerType) {
                            return {...app, providerName: app.providerType.toLowerCase()};
                        }
                        return app;
                    })
                };
            } else if (item.urlSlug) {
                // APPLICATION config - transform application directly
                if (!item.providerName && item.providerType) {
                    return {...item, providerName: item.providerType.toLowerCase()};
                }
            }
            return item;
        });

        return {
            ...config,
            data: transformedData
        };
    }
}
