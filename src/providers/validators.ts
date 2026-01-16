import {OllamaRequestValidator, OllamaResponseValidator} from "./ollama/validators";
import {ClaudeChatRequestValidator, ClaudeResponseValidator} from "./claude/validators";
import {OpenAIChatRequestValidator, OpenAIChatCompletionResponseValidator} from "./openai/validators";
import {ProviderRequest, ProviderResponse} from "./types";
import {type} from "arktype";

export * from './claude/validators';
export * from './holo/validators';
export * from './ollama/validators';
export * from './openai/validators';


export const ProviderRequestValidator =
    OllamaRequestValidator
        .or(ClaudeChatRequestValidator)
        .or(OpenAIChatRequestValidator) satisfies type<ProviderRequest>;

export const ProviderResponseValidator =
    OllamaResponseValidator
        .or(ClaudeResponseValidator)
        .or(OpenAIChatCompletionResponseValidator) satisfies type<ProviderResponse>;
