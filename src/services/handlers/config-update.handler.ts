import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {MessageHandler} from '../../admin/services';
import logger from '../../utils/logger';
import cacheService from '../../admin/services/organization.cache.service';


import {HoloConfig} from "../../cache/types";

@injectable()
export class ConfigUpdateHandler implements MessageHandler {

    async handle(message: HoloConfig): Promise<void> {
        logger.info(`Processing config update message: ${message.configType} with ${message.data.length} applications`);

        try {
            // Validate the config structure
            this.validateConfig(message);

            // Handle different actions
            switch (message.action) {
                case 'NEW':
                case 'UPDATE':
                    await this.handleConfigUpdate(message);
                    break;
                case 'DELETE':
                    await this.handleConfigDelete(message);
                    break;
                default:
                    logger.warn(`Unknown config action: ${message.action}`);
                    return;
            }

            logger.info(`Successfully processed ${message.action} configuration with ${message.data.length} applications`);

        } catch (error) {
            logger.error(`Failed to process config update: ${(error as Error).message}`, {
                entityType: message.configType,
                action: message.action,
                error: (error as Error).stack
            });
            throw error;
        }
    }

    /**
     * Handle config updates (NEW/UPDATE actions)
     */
    private async handleConfigUpdate(config: HoloConfig): Promise<void> {
        logger.debug(`Updating cache with ${config.data.length} applications`);

        // Update cache with new applications
        const success = cacheService.setApplications(config.data);

        if (!success) {
            throw new Error('Failed to update application cache');
        }

        // Log individual application updates
        config.data.forEach(app => {
            logger.debug(`Cached application: ${app.urlSlug} (${app.providerType}) - ${app.models.length} models`);
        });

        logger.info(`Cache updated successfully with ${config.data.length} applications`);
    }

    /**
     * Handle config deletions (DELETE action)
     */
    private async handleConfigDelete(config: HoloConfig): Promise<void> {
        logger.debug(`Removing ${config.data.length} applications from cache`);

        let removedCount = 0;

        // Remove each application from cache
        config.data.forEach(app => {
            const removed = cacheService.removeApplication(app.urlSlug);
            if (removed) {
                removedCount++;
                logger.debug(`Removed application from cache: ${app.urlSlug}`);
            } else {
                logger.warn(`Application not found in cache for removal: ${app.urlSlug}`);
            }
        });

        logger.info(`Cache cleanup completed: ${removedCount}/${config.data.length} applications removed`);
    }

    /**
     * Validate config structure
     */
    private validateConfig(config: HoloConfig): void {
        if (!config.configType) {
            throw new Error('Missing configType in config');
        }

        if (!config.action) {
            throw new Error('Missing action in config');
        }

        if (!Array.isArray(config.data)) {
            throw new Error('Config data must be an array');
        }

        // Validate each application in the data array
        config.data.forEach((app, index) => {
            if (!app.urlSlug) {
                throw new Error(`Application at index ${index} missing urlSlug`);
            }
            if (!app.organizationId) {
                throw new Error(`Application at index ${index} missing organizationId`);
            }
            if (!app.providerType) {
                throw new Error(`Application at index ${index} missing providerType`);
            }
            if (!Array.isArray(app.models) || app.models.length === 0) {
                throw new Error(`Application at index ${index} must have at least one model`);
            }
        });
    }

}
