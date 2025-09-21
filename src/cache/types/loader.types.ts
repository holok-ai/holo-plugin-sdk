import {EventEmitter} from "events";
import {HoloConfig} from "../../admin/types/config.types";

export interface ConfigLoaderEvents {
    'config:initial': (config: HoloConfig) => void;
    'config:updated': (config: HoloConfig) => void;
    'config:error': (error: Error) => void;
    'platform:ready': () => void;
    'loader:ready': () => void;
}

export interface ConfigLoader extends EventEmitter {
    loadConfig(): Promise<HoloConfig>;
}
