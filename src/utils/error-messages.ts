/**
 * Standardized error messages and error response utilities
 * Provides consistent error messaging across all providers and services
 */

export class ErrorMessages {
    // Validation errors
    static readonly MODEL_REQUIRED = 'Model is required';
    static readonly PROMPT_REQUIRED = 'Prompt is required';
    static readonly MESSAGES_REQUIRED = 'Messages array is required';
    
    // Dynamic validation errors
    static modelNotFound(model: string): string {
        return `Model '${model}' not found`;
    }
    
    static apiKeyRequired(provider: string): string {
        return `${provider} API key is required`;
    }
    
    static invalidProvider(provider: string, expectedProvider: string): string {
        return `Invalid provider '${provider}', expected '${expectedProvider}'`;
    }
    
    static unsupportedProvider(provider: string): string {
        return `Unsupported provider: ${provider}`;
    }
    
    static unsupportedRequestType(type: string): string {
        return `Unsupported request type: ${type}`;
    }
    
    // Message validation errors
    static readonly MESSAGE_ROLE_CONTENT_REQUIRED = 'Each message must have role and content';
    
    static invalidMessageRole(validRoles: string[]): string {
        return `Message role must be one of: ${validRoles.join(', ')}`;
    }
}

/**
 * Standardized error response structure
 */
export interface StandardErrorResponse {
    error: {
        message: string;
        code?: string;
        provider?: string;
        requestId?: string;
    };
    type: 'error';
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(
    message: string,
    requestId?: string,
    provider?: string,
    code?: string
): StandardErrorResponse {
    return {
        type: 'error',
        error: {
            message,
            ...(requestId && { requestId }),
            ...(provider && { provider }),
            ...(code && { code })
        }
    };
}