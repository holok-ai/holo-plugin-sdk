import {type, type Type} from 'arktype';
import {
    HoloContent,
    HoloContentImage,
    HoloContentText,
    HoloContentToolResult,
    HoloRequest,
    HoloRequestMessage,
    HoloRequestMetadata,
    HoloResponseFormat,
    HoloTool,
    HoloToolCall,
    HoloToolChoice,
    HoloToolFunctionCall
} from "./types";

// ---------- HoloContent validators ----------
export const HoloContentTextValidator = type({
    type: "'text'",
    text: 'string'
}) satisfies Type<HoloContentText>;

export const HoloContentImageValidator = type({
    type: "'image'",
    url: 'string',
    'mime?': 'string',
    'alt_text?': 'string'
}) satisfies Type<HoloContentImage>;

export const HoloContentToolResultValidator = type({
    type: "'tool_result'",
    tool_call_id: 'string',                                             // Must match the originating tool call
    'content?': type('string').or((HoloContentTextValidator.or(HoloContentImageValidator)).array()),
    'is_error?': 'boolean'
}) satisfies Type<HoloContentToolResult>;

export const HoloContentValidator =
    HoloContentTextValidator
        .or(HoloContentImageValidator)
        .or(HoloContentToolResultValidator) satisfies Type<HoloContent>;

// ---------- Tool calling validators ----------
export const HoloToolFunctionCallValidator = type({
    name: 'string',
    arguments: 'Record<string, unknown>'
}) satisfies Type<HoloToolFunctionCall>;

export const HoloToolCallValidator = type({
    'id?': 'string',
    type: "'function'",
    function: HoloToolFunctionCallValidator
}) satisfies Type<HoloToolCall>;

// ---------- Message validator ----------
export const HoloRequestMessageValidator = type({
    role: "'user'|'assistant'|'tool'",
    content: type('string').or(HoloContentValidator.array()),
    'tool_calls?': HoloToolCallValidator.array(),
    'tool_call_id?': 'string',
    'name?': 'string'
}) satisfies Type<HoloRequestMessage>;

// ---------- Tool definition validator ----------
export const HoloRequestToolValidator = type({
    name: 'string',
    'description?': 'string',
    'parameters?': 'Record<string, unknown>'
}) satisfies Type<HoloTool>;

// ---------- Tool choice validator ----------
export const HoloRequestToolChoiceValidator = type("'auto'|'none'|'required'").or(type({
    type: "'specific'",
    name: 'string'
})) satisfies Type<HoloToolChoice>;

// ---------- Response format validators ----------
export const HoloResponseFormatTextValidator = type({
    type: "'text'"
});

export const HoloResponseFormatJsonObjectValidator = type({
    type: "'json_object'"
});

export const HoloResponseFormatJsonSchemaValidator = type({
    type: "'json_schema'",
    schema: 'Record<string, unknown>',
    'strict?': 'boolean'
});

export const HoloRequestResponseFormatValidator = HoloResponseFormatTextValidator
    .or(HoloResponseFormatJsonObjectValidator)
    .or(HoloResponseFormatJsonSchemaValidator) satisfies Type<HoloResponseFormat>;

// ---------- Metadata validator ----------
export const HoloRequestMetadataValidator = type({
    'user_id?': 'string | null'
}) satisfies Type<HoloRequestMetadata>;

// ---------- Main Holo Request validator (portable fields only) ----------
export const HoloRequestValidator = type({
    // 🟢 COMMON (All Providers)
    model: 'string', // Required
    'messages?': HoloRequestMessageValidator.array(),
    'temperature?': 'number',
    'top_p?': 'number',
    'stream?': 'boolean',
    'tools?': HoloRequestToolValidator.array(),

    // 🟡 MAPPED (≥2 Providers)
    'system?': 'string',
    'max_tokens?': 'number',
    'max_completion_tokens?': 'number',
    'stop_sequences?': 'string[]',
    'response_format?': HoloRequestResponseFormatValidator,
    'service_tier?': "'auto'|'default'|'standard_only'",
    'tool_choice?': HoloRequestToolChoiceValidator,
    'top_k?': 'number',
    'frequency_penalty?': 'number',
    'presence_penalty?': 'number',
    'seed?': 'number',
    'metadata?': HoloRequestMetadataValidator.or('null')
}) satisfies Type<HoloRequest>;

// Default values for Holo request
const HoloRequestDefaults: Partial<HoloRequest> = {
    stream: false,
    temperature: 1.0,
    top_p: 1.0,
    tool_choice: 'auto',
    response_format: {type: 'text'}
};

export const HoloRequestWithDefaults = HoloRequestValidator.pipe((data) => {
    return {
        ...HoloRequestDefaults,
        ...data
    };
});
