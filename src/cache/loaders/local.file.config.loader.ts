import fs from 'fs';
import path from 'path';
import {EventEmitter} from 'events';
import {injectable} from 'tsyringe';
import logger from '../../utils/logger';
import cacheService from '../../admin/services/cache.service';

import {ConfigLoader, HoloConfig} from "../types";

@injectable()
export class LocalFileConfigLoader extends EventEmitter implements ConfigLoader {

    constructor(private configFilePath?: string) {
        super();
        this.setMaxListeners(10);
    }

    async loadConfig(): Promise<HoloConfig> {
        try {
            const filePath = this.configFilePath || './sample.app.config.json';
            const absolutePath = path.resolve(filePath);

            logger.info(`Loading proxy configuration from: ${absolutePath}`);

            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Configuration file not found: ${absolutePath}`);
            }

            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const config = JSON.parse(fileContent) as HoloConfig;

            this.validateConfig(config);

            // Cache applications
            cacheService.setApplications(config.data);

            // Emit events
            this.emit('loader:ready');
            this.emit('config:initial', config);

            logger.info(`Successfully loaded ${config.data.length} applications from configuration file`);
            return config;

        } catch (error) {
            logger.error(`Failed to load configuration file: ${(error as Error).message}`);
            this.emit('config:error', error as Error);
            throw error;
        }
    }

    private validateConfig(config: any): void {
        if (!config.entity_type) {
            throw new Error('Configuration must include entity_type');
        }

        if (!['APPLICATION', 'JWT_TOKEN'].includes(config.entity_type)) {
            throw new Error(`Invalid entity_type: ${config.entity_type}. Must be APPLICATION or JWT_TOKEN`);
        }

        if (!config.action) {
            throw new Error('Configuration must include action');
        }

        if (!['NEW', 'UPDATE', 'DELETE'].includes(config.action)) {
            throw new Error(`Invalid action: ${config.action}. Must be NEW, UPDATE, or DELETE`);
        }

        if (!Array.isArray(config.data)) {
            throw new Error('Configuration must include data array');
        }

        config.data.forEach((app: any, index: number) => {
            if (!app.urlSlug) {
                throw new Error(`Application at index ${index} must have a urlSlug`);
            }
            if (!app.organizationId) {
                throw new Error(`Application at index ${index} must have an organizationId`);
            }
            if (!app.providerType) {
                throw new Error(`Application at index ${index} must have a providerType`);
            }
            if (!Array.isArray(app.models) || app.models.length === 0) {
                throw new Error(`Application at index ${index} must have a models array with at least one model`);
            }

            app.models.forEach((model: any, modelIndex: number) => {
                if (!model.name || !model.accessModel) {
                    throw new Error(`Model at index ${modelIndex} in application ${index} must have both name and accessModel`);
                }
            });
        });
    }
}
