export {PluginErrorCode} from '@holokai/holo-types/plugin';

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
