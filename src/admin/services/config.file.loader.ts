import fs from 'fs';
import path from 'path';
import {EventEmitter} from 'events';
import {injectable} from 'tsyringe';
import logger from '../../utils/logger';
import {ConfigService} from "./config.service";
import {ConfigLoader} from "../types";
import {env} from "../../env";
import {HoloConfig} from "@holokai/sdk/core";

@injectable()
export class ConfigFileLoader extends EventEmitter implements ConfigLoader {

    constructor(
        private configService: ConfigService,
        private configFilePath?: string) {
        super();
        this.setMaxListeners(10);
    }

    async loadConfig(): Promise<void> {
        try {
            const absolutePath = path.resolve(this.configFilePath ?? env.api.configFile);

            logger.info(`Loading configuration from: ${absolutePath}`);

            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Configuration file not found: ${absolutePath}`);
            }

            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const config = JSON.parse(fileContent) as HoloConfig;

            if(!(await this.configService.processConfig(config))) {
                throw new Error('Failed to process configuration');
            }
        } catch (error) {
            logger.error(`Failed to load configuration file: ${(error as Error).message}`);
            this.emit('config:error', error as Error);
            throw error;
        }
    }
}
