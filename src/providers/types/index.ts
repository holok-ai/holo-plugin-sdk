/**
 * Interface for LLM providers
 * All LLM provider implementations must conform to this interface
 */
export interface IProvider {
    name: string;

    /**
     * Initialize the provider.
     */
    init(): Promise<void>;

    /**
     * Get available models from the provider.
     * @returns Array of available models.
     */
    getModels(): Promise<ModelInfo[]>;

    /**
     * Generate text from a prompt with streaming.
     * @param requestId Unique request identifier
     * @param sourceId Source identifier
     * @param model Model name
     * @param prompt Prompt text
     * @param options Additional options for generation
     * @param stream Enable streaming responses
     */
    generate(
        requestId: string,
        sourceId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<AIRequestStat>;

    /**
     * Generate chat completion with streaming.
     * @param requestId Unique request identifier
     * @param sourceId Source identifier
     * @param model Model name
     * @param messages Chat message array
     * @param options Additional options for the chat
     * @param stream Enable streaming responses
     */
    chat(
        requestId: string,
        sourceId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<AIRequestStat>;

}

export interface AIProviderConfig {
    apiKey?: string
    auditEnabled: boolean
}

export interface OllamaProviderConfig extends AIProviderConfig {
    host: string,
    timeout: number
}

/**
 * Model information interface
 */
export interface ModelInfo {
    id: string;
    name?: string;
    description?: string;
    size?: number;
    parameterCount?: string;
    quantization?: string;
    family?: string;
    parentModel?: string;
    format?: string;

    [key: string]: any; // Allow additional properties
}

/**
 * Model status interface
 */
export interface ModelStatus {
    id: string;
    loaded: boolean;
    size?: number;
    digest?: string;
    details?: {
        parent_model?: string;
        format?: string;
        family?: string;
        families?: string[];
        parameter_size?: string;
        quantization_level?: string;
    };
    expires_at?: string;
    size_vram?: number;

    [key: string]: any;
}

/**
 * Model operation result interface
 */
export interface ModelOperationResult {
    success: boolean;
    message?: string;
    error?: string;

    [key: string]: any;
}

export interface AIRequestStat {
    type: 'generate' | 'chat';
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}


export type TokenHandler = (sourceId: string, requestId: string, token: object, type: string, customFields?: object) => Promise<void>;
export type CompleteHandler = (sourceId: string, requestId: string, token: object, type?: string, customFields?: object) => Promise<void>;
