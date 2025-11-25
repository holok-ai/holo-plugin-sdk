import {type} from 'arktype';
import {GuardResultValidator} from '../admin/types';
import {LLMWorkerRequest, LLMWorkerResponse} from "./worker.types";
import {ProviderType, RequestType} from "../providers/types";
import {ProviderRequestValidator, ProviderResponseValidator} from "../providers/validators";
import {PromptValidator} from "../cache";

export const ProviderTypeValidator = type.valueOf(ProviderType);

export const RequestTypeValidator = type.valueOf(RequestType);

/**
 * Validator for LLMWorkerRequest
 * Note: payload is 'unknown' since ProviderRequest is a complex union type
 */
// UUID validator - matches standard UUID format (8-4-4-4-12 hex digits)
const UUIDValidator = type('string').narrow((s, ctx) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(s) || ctx.mustBe('a valid UUID');
});

export const LLMWorkerRequestValidator = type({
    'organizationId?': 'string',
    providerType: ProviderTypeValidator,
    'providerName?': 'string',
    sourceId: 'string',
    'appSlug?': 'string',
    'userId?': 'string',
    'thread_id?': UUIDValidator,
    requestId: 'string',
    type: RequestTypeValidator,
    payload: ProviderRequestValidator,
    timestamp: 'number',
    isStreaming: 'boolean',
    'systemPrompt?': PromptValidator,
    'options?': 'Record<string, unknown>',
    'guards?': PromptValidator.array(),
    'guardResult?': GuardResultValidator,
    'errors?': type('string').array()
}) satisfies type<LLMWorkerRequest>;

/**
 * Validator for LLMWorkerResponse
 * Note: payload can be a single ProviderResponse or array of ProviderResponse[] (for guard errors)
 */
export const LLMWorkerResponseValidator = type({
    'organizationId?': 'string',
    sourceId: 'string',
    requestId: 'string',
    providerType: ProviderTypeValidator,
    'providerName?': 'string',
    payload: ProviderResponseValidator.or(ProviderResponseValidator.array()),
    'fullResponse?': 'string',
    workerId: 'string',
    'timestamp?': 'number',
    'metrics?': type({
        inputTokens: 'number',
        outputTokens: 'number',
        timeToFirstToken: 'number',
        totalProcessingTime: 'number'
    })
}) satisfies type<LLMWorkerResponse>;
