import {OllamaChatRequestValidator, OllamaGenerateRequestValidator} from "./ollama/validators";
import {ClaudeChatRequestValidator} from "./claude/validators";
import {OpenAIChatRequestValidator} from "./openai/validators";

export * from './claude/validators';
export * from './holo/validators';
export * from './ollama/validators';
export * from './openai/validators';


export const ProviderRequestValidator = OllamaChatRequestValidator.or(OllamaGenerateRequestValidator).or(ClaudeChatRequestValidator).or(OpenAIChatRequestValidator);

