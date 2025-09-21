import {Type, type} from "arktype";
import {ProviderType} from "../../providers/types";
import {ModelValidator} from "./model.validator";
import {SystemPromptValidator} from "./system.prompt.validator";
import {GuardValidator} from "./guard.validator";
import {EvaluatorValidator} from "./evaluator.validator";
import {Application} from "../types";

export const ApplicationValidator = type({
    urlSlug: 'string',
    organizationId: 'string',
    providerType: type.valueOf(ProviderType), // ProviderType from providers/types
    models: ModelValidator.array(),
    'systemPrompt?': SystemPromptValidator,
    'guards?': GuardValidator.array(),
    'evaluators?': EvaluatorValidator.array()
}) satisfies Type<Application>;
