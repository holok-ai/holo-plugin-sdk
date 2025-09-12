import { EventEmitter } from 'events';
import { ProxyConfig } from '../../types';

export interface ConfigLoaderEvents {
    'config:initial': (config: ProxyConfig) => void;
    'config:updated': (config: ProxyConfig) => void;
    'config:error': (error: Error) => void;
    'platform:ready': () => void;
    'loader:ready': () => void;
}

export interface ConfigLoader extends EventEmitter {
    loadConfig(): Promise<ProxyConfig>;
}