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

export const LLMWorkerRequestValidator = type({
    'organizationId?': 'string',
    providerType: ProviderTypeValidator,
    'providerName?': 'string',
    sourceId: 'string',
    'appSlug?': 'string',
    'userId?': 'string',
    'thread_id?': 'string',
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
