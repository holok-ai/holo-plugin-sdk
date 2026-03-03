import {PluginErrorCode} from "@holokai/types/plugin";

export {PluginErrorCode};

export class PluginError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly plugin?: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'PluginError';
    }
}
