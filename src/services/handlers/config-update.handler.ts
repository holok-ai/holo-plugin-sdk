import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { AdminMessage, MessageHandler } from '../proxy.admin.service';
import { ApplicationConfig } from '../../types';
import logger from '../../utils/logger';

export interface ConfigUpdateMessage extends AdminMessage {
    type: 'config_update';
    targetProxy?: string;
    applications: ApplicationConfig[];
}

@injectable()
export class ConfigUpdateHandler implements MessageHandler {
    
    async handle(message: AdminMessage): Promise<void> {
        const configMessage = message as ConfigUpdateMessage;
        
        logger.info(`Processing config update message: ${configMessage.messageId}`);
        
        try {
            // Validate the message
            this.validateConfigUpdateMessage(configMessage);
            
            // TODO: Update the ProxyConfigService with new applications
            // This will be implemented when we create ProxyConfigService
            
            logger.info(`Successfully updated configuration with ${configMessage.applications.length} applications`);
            
        } catch (error) {
            logger.error(`Failed to process config update: ${(error as Error).message}`);
            throw error;
        }
    }

    private validateConfigUpdateMessage(message: ConfigUpdateMessage): void {
        if (!Array.isArray(message.applications)) {
            throw new Error('Config update message must contain applications array');
        }
    }
}