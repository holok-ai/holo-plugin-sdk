import { injectable, container } from 'tsyringe';
import { ConfigLoader } from './config-loader.interface';
import { LocalFileConfigLoader } from './local-file-config-loader';
import { MqConfigLoader } from './mq-config-loader';
import { QueueService } from '../queue.service';
import { env } from '../../env';
import logger from '../../utils/logger';

@injectable()
export class ConfigLoaderFactory {
    
    static createConfigLoader(serverId?: string): ConfigLoader {
        const configMode = process.env.PROXY_CONFIG_MODE || 'MOKU';
        
        logger.info(`Config Loader Factory: Creating config loader with mode: ${configMode}`);

        switch (configMode.toUpperCase()) {
            case 'FILE':
                const filePath = env.proxy.configFilePath;
                logger.debug(`Config Loader Factory: Using LocalFileConfigLoader with path: ${filePath}`);
                return new LocalFileConfigLoader(filePath);
                
            case 'MOKU':
                const queueService = container.resolve(QueueService);
                logger.debug(`Config Loader Factory: Using MqConfigLoader with serverId: ${serverId || 'default'}`);
                return new MqConfigLoader(queueService, serverId);
                
            default:
                logger.warn(`Config Loader Factory: Unknown config mode '${configMode}', defaulting to MOKU`);
                const defaultQueueService = container.resolve(QueueService);
                return new MqConfigLoader(defaultQueueService, serverId);
        }
    }
}