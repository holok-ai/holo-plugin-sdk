export interface Prompt {
    id: string;
    systemPrompt?: string;
    userPrompt: string;
    outputSchema?: Record<string, any>;
    providerName: string;
    modelName: string;
}
