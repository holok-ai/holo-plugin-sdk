import {type, type Type} from 'arktype';
import {HoloFinishReason, HoloMessage, HoloResponse, HoloStreamChunk, HoloStreamingDelta, HoloUsage, HoloProviderDelta} from "../types";
import {HoloContentValidator, HoloToolCallValidator} from "./holo.requests";
import {OpenAIChatCompletionChunkValidator} from "../../openai/validators";
import {
    ClaudeRawContentBlockDeltaEventValidator,
    ClaudeRawContentBlockStartEventValidator,
    ClaudeRawContentBlockStopEventValidator,
    ClaudeRawMessageDeltaEventValidator,
    ClaudeRawMessageStartEventValidator,
    ClaudeRawMessageStopEventValidator
} from "../../claude/validators";
import {OllamaChatResponseValidator, OllamaGenerateResponseValidator} from "../../ollama/validators";

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
    role: "'user'|'assistant'|'tool'",
    content: HoloContentValidator.array().or('string'),
    'tool_calls?': HoloToolCallValidator.array()
}) satisfies Type<HoloMessage>;

// ---------- Main Holo Response validator (portable fields only) ----------
export const HoloResponseValidator = type({
    // Common
    'id?': 'string',
    model: 'string',
    messages: HoloMessageValidator.array(),

    // Mapped (functional equivalents)
    'created?': 'number | Date',
    'finish_reason?': HoloFinishReasonValidator,
    'service_tier?': 'string',

    // Usage
    'usage?': HoloUsageValidator,
}) satisfies Type<HoloResponse>;

// ---------- Streaming validators ----------
export const HoloProviderDeltaValidator = ClaudeRawMessageStartEventValidator
    .or(ClaudeRawMessageDeltaEventValidator)
    .or(ClaudeRawMessageStopEventValidator)
    .or(ClaudeRawContentBlockStartEventValidator)
    .or(ClaudeRawContentBlockDeltaEventValidator)
    .or(ClaudeRawContentBlockStopEventValidator)
    .or(OpenAIChatCompletionChunkValidator)
    .or(OllamaChatResponseValidator.partial())
    .or(OllamaGenerateResponseValidator.partial()) satisfies Type<HoloProviderDelta>;

export const HoloStreamingDeltaValidator = type({
    provider: "'claude'|'openai'|'ollama'",
    type: "'message_start'|'content_delta'|'message_delta'|'message_stop'",
    'index?': 'number',
    'choice?': 'number',
    delta: HoloMessageValidator.partial(), // Partial<HoloMessage>
    'usage?': HoloUsageValidator.or('null'),
    'provider_delta?': HoloProviderDeltaValidator.or('undefined')
}) satisfies Type<HoloStreamingDelta>;

export const HoloStreamChunkValidator = type({
    'id?': 'string',
    'model?': 'string',
    'created?': 'number',
    'delta?': HoloStreamingDeltaValidator,
    'done?': 'boolean',
    'finish_reason?': HoloFinishReasonValidator,
    'usage?': HoloUsageValidator
}) satisfies Type<HoloStreamChunk>;
