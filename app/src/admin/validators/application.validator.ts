import {Type, type} from "arktype";
import {ModelValidator} from "./model.validator";
import {PromptValidator} from "./prompt.validator";
import type {ApplicationConfigProps} from "@holokai/types/config";

export const ApplicationValidator = type({
    urlSlug: 'string',
    organizationId: 'string',
    providerName: 'string',
    providerType: 'string', // ProviderType from providers/types
    models: ModelValidator.array(),
    'systemPrompt?': PromptValidator,
    'guards?': PromptValidator.array(),
    'evaluators?': PromptValidator.array()
}) satisfies Type<ApplicationConfigProps>;
