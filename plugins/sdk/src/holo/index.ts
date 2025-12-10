/**
 * @holokai/sdk/holo - Holo universal format types and validators
 *
 * The Holo format serves as the universal translation hub in the plugin system,
 * implementing a hub-and-spoke pattern for provider translations. This prevents
 * N² translation complexity by standardizing on a portable format that handles
 * the full complexity of legacy providers to enable complete replacement.
 *
 * @packageDocumentation
 */

import {HoloContent, HoloContentImage, HoloContentText, HoloRequest} from "./types.js";

// Export all types
export * from './types.js';
export * from './holo.response.factory';

// Default values for Holo request
export const HoloRequestDefaults: Partial<HoloRequest> = {
    stream: false,
    temperature: 1.0,
    top_p: 1.0,
    tool_choice: {type: 'auto'},
    response_format: {type: 'text'}
};

export function isText(p: HoloContent): p is HoloContentText {
    return p.type === "text";
}

export function isImage(p: HoloContent): p is HoloContentImage {
    return p.type === "image";
}

// Validators removed - using TypeScript types only for plugin architecture
