import {Type, type} from "arktype";
import {PromptConfigProps} from "@holokai/sdk";

export const PromptValidator = type({
    id: 'string',
    systemPrompt: 'string',
    userPrompt: 'string',
    'outputSchema?': 'Record<string, unknown>',
    providerName: 'string',
    modelName: 'string'
}) satisfies Type<PromptConfigProps>;
