import { ProxyConfig } from '../../types';

export interface ConfigLoader {
    loadConfig(): Promise<ProxyConfig>;
}