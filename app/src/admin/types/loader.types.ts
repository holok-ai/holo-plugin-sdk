import {EventEmitter} from "events";
import type {HoloConfig} from "@holokai/types/config";

export interface ConfigLoaderEvents {
    'config:initial': (config: HoloConfig) => void;
    'config:updated': (config: HoloConfig) => void;
    'config:error': (error: Error) => void;
    'platform:ready': () => void;
    'loader:ready': () => void;
}

export interface ConfigLoader extends EventEmitter {
    loadConfig(): Promise<void>;
}
