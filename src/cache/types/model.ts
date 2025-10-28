// OpenAI Model type alias (stored in DB metadata.openai)
// Maps to OpenAI SDK Model type from openai/resources/models.d.ts
import type { Model as OpenAISDKModel } from 'openai/resources/models';
export type OpenAIModel = OpenAISDKModel;

// Claude Model type alias (stored in DB metadata.claude)
// Maps to Anthropic SDK ModelInfo type from @anthropic-ai/sdk/resources/models.d.ts
import type { ModelInfo } from '@anthropic-ai/sdk/resources/models';
export type ClaudeModelInfo = ModelInfo;

// Ollama Model type aliases (stored in DB metadata.ollama)
// Map to Ollama SDK types from ollama
import type { ModelDetails as OllamaSDKModelDetails, ModelResponse as OllamaSDKModelResponse } from 'ollama';
export type OllamaModelDetails = OllamaSDKModelDetails;
export type OllamaModelResponse = OllamaSDKModelResponse;

// Cache Model interface (maps to DB Model + our internal structure)
export interface Model {
    name: string;
    accessModel: string;
    providerName: string;
    metadata?: {
        openai?: OpenAIModel;
        claude?: ClaudeModelInfo;
        ollama?: OllamaModelResponse;
    };
}
