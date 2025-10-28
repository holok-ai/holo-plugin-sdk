import {Type, type} from "arktype";
import {ProviderType} from "../../providers/types";
import {ModelValidator} from "./model.validator";
import {PromptValidator} from "./prompt.validator";
import {Application} from "../types";

export const ApplicationValidator = type({
    urlSlug: 'string',
    organizationId: 'string',
    providerType: type.valueOf(ProviderType), // ProviderType from providers/types
    models: ModelValidator.array(),
    'systemPrompt?': PromptValidator,
    'guards?': PromptValidator.array(),
    'evaluators?': PromptValidator.array()
}) satisfies Type<Application>;
