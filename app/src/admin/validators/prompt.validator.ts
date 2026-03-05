import {Type, type} from "arktype";
import type {PromptConfigProps} from "@holokai/types/config";

export const PromptValidator = type({
    id: 'string',
    systemPrompt: 'string',
    userPrompt: 'string',
    'outputSchema?': 'Record<string, unknown>',
    providerName: 'string',
    modelName: 'string'
}) satisfies Type<PromptConfigProps>;
