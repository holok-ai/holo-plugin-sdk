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

// Export all types
export type {
    // Core Request/Response
    HoloRequest,
    HoloResponse,
    HoloMessage,
    HoloChoice,
    HoloUsage,
    HoloFinishReason,

    // Content types
    HoloContent,
    HoloContentText,
    HoloContentImage,

    // Tool/Function types
    HoloTool,
    HoloToolCall,
    HoloToolFunctionCall,
    HoloToolChoice,

    // Response format types
    HoloResponseFormat,
    HoloResponseFormatText,
    HoloResponseFormatJsonObject,
    HoloResponseFormatJsonSchema,

    // Request metadata
    HoloRequestMetadata,
    RequestType,

    // Streaming types
    StreamingProviderType,
    HoloStreamingDeltaType,
    HoloStreamingDelta,
    HoloStreamChunk,
    HoloStreamChoice,
    HoloStreamResponse,

    // Legacy compatibility aliases
    Tool,
    ToolCall,
    FunctionDefinition,
    FunctionCall
} from './types.js';

// Validators removed - using TypeScript types only for plugin architecture