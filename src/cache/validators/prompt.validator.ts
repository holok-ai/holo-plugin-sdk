import {Type, type} from "arktype";
import {Prompt} from "../types";

export const PromptValidator = type({
    id: 'string',
    systemPrompt: 'string',
    userPrompt: 'string',
    'outputSchema?': 'Record<string, unknown>',
    providerName: 'string',
    modelName: 'string'
}) satisfies Type<Prompt>;
