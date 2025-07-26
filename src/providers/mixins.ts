import {ModelInfo, ModelOperationResult, ModelStatus} from './types';
import {Constructor} from "../types";

/**
 * Interface for providers that support local model operations
 */
export interface LocalModelProvider {
    /**
     * Load a model into memory (for local models)
     * @param modelId - Model identifier
     * @param options - Model-specific options
     * @returns Result of the operation
     */
    loadModel(modelId: string, options?: Record<string, any>): Promise<ModelOperationResult>;

    /**
     * Unload a model from memory (for local models)
     * @param modelId - Model identifier
     * @returns Result of the operation
     */
    unloadModel(modelId: string): Promise<ModelOperationResult>;
}

/**
 * Mixin to add local model management functionality to a provider
 */
export function withLocalModels<TBase extends Constructor<{
    getModels(): Promise<ModelInfo[]>;
}>>(Base: TBase) {
    abstract class WithLocalModelsClass extends Base implements LocalModelProvider {
        /**
         * Validate if model exists
         * @param model - Model name
         * @returns Whether model exists
         */
        async validateModel(model: string): Promise<boolean> {
            const models = await this.getModels();
            return models.some(m => m.id === model);
        }

        /**
         * Load a model into memory (for local models)
         * @param modelId - Model identifier
         * @param options - Model-specific options
         * @returns Result of the operation
         */
        abstract loadModel(modelId: string, options?: Record<string, any>): Promise<ModelOperationResult>;

        /**
         * Unload a model from memory (for local models)
         * @param modelId - Model identifier
         * @returns Result of the operation
         */
        abstract unloadModel(modelId: string): Promise<ModelOperationResult>;

        /**
         * Get status of a specific model
         * @param modelId - Model identifier
         * @returns Model status information
         */
        abstract getModelStatus(modelId: string): Promise<ModelStatus>;
    }

    return WithLocalModelsClass;
}
