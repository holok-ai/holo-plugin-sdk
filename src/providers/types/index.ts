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
    ): Promise<void>;

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
    ): Promise<void>;

    /**
     * Validate if a model exists.
     * @param model - Model name
     * @returns Whether model exists
     */
    validateModel(model: string): Promise<boolean>;

    /**
     * Get status of a specific model.
     * @param modelId - Model identifier
     * @returns Model status information
     */
    getModelStatus(modelId: string): Promise<any>;

    /**
     * Get detailed information about a model.
     * @param modelId - Model identifier
     * @returns Model details
     */
    getModelDetails(modelId: string): Promise<ModelInfo>;
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
 * Generation parameters for text generation
 */

/**
 * Generation options interface
 */
export interface LlmOptions {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_tokens?: number;
    stop?: string | string[];
    stream?: boolean;
    user?: string;

    [key: string]: any; // Allow additional provider-specific options
}

export interface GenerateParams extends LlmOptions {
    model: string;
    prompt: string;

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


