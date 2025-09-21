import {Type, type} from "arktype";
import {SystemPrompt, SystemPromptMode} from "../types";

export const SystemPromptValidator = type({
    content: 'string',
    mode: type.valueOf(SystemPromptMode)
}) satisfies Type<SystemPrompt>;
