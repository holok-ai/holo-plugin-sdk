export interface PromptConfigProps {
    id: string;
    systemPrompt?: string;
    userPrompt: string;
    outputSchema?: Record<string, any>;
    providerName: string;
    modelName: string;
}
