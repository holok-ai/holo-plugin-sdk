import {type, type Type} from 'arktype';
import {HoloFinishReason, HoloMessage, HoloResponse, HoloStreamChunk, HoloStreamingDelta, HoloUsage,} from "./types";
import {HoloContentValidator, HoloToolCallValidator} from "./holo.request.validators";

// ---------- Usage validator ----------
export const HoloUsageValidator = type({
    'input_tokens?': 'number',
    'output_tokens?': 'number',
    'total_tokens?': 'number',
    'cache_read_tokens?': 'number',
    'cache_write_tokens?': 'number',
    'service_tier?': "'standard'|'priority'|'batch'|'auto'|'default'|'flex'|'scale'",
    'timings?': type({
        'total?': 'number',
        'load?': 'number',
        'prompt_eval?': 'number',
        'eval?': 'number'
    })
}) satisfies Type<HoloUsage>;

// ---------- Finish reason validator ----------
export const HoloFinishReasonValidator = type("'stop'|'length'|'tool_calls'|'content_filter'|'function_call'|null") satisfies Type<HoloFinishReason>;

// ---------- Message validator ----------
export const HoloMessageValidator = type({
    role: "'assistant'|'tool'",
    content: HoloContentValidator.array().or('string'),
    'tool_calls?': HoloToolCallValidator.array()
}) satisfies Type<HoloMessage>;

// ---------- Main Holo Response validator (portable fields only) ----------
export const HoloResponseValidator = type({
    // 🟢 Common
    'id?': 'string',
    model: 'string',
    messages: HoloMessageValidator.array(),

    // 🟡 Mapped (functional equivalents)
    'created?': 'number | Date',
    'finish_reason?': HoloFinishReasonValidator,
    'service_tier?': 'string',

    // 🟠 Usage
    'usage?': HoloUsageValidator,
}) satisfies Type<HoloResponse>;

// ---------- Streaming validators ----------
export const HoloStreamingDeltaValidator = type({
    provider: "'claude'|'openai'|'ollama'",
    type: "'message_start'|'content_delta'|'message_delta'|'message_stop'",
    'index?': 'number',
    delta: HoloMessageValidator.partial(), // Partial<HoloMessage>
    'usage?': HoloUsageValidator.or('null')
}) satisfies Type<HoloStreamingDelta>;

export const HoloStreamChunkValidator = type({
    'id?': 'string',
    model: 'string',
    'object?': 'string',
    'delta?': HoloStreamingDeltaValidator,
    'done?': 'boolean',
    'finish_reason?': HoloFinishReasonValidator,
    'usage?': HoloUsageValidator
}) satisfies Type<HoloStreamChunk>;
