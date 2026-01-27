import type {Application} from "./application";
import type {User} from "./user";
import type {Provider} from "./provider";

export type {Provider} from "./provider";
export type {Prompt} from "./prompt";
export type {
    Model,
    OpenAIModel,
    ClaudeModelInfo,
    OllamaModelDetails,
    OllamaModelResponse
} from "./model";
export {SystemPromptMode} from "./system.prompt";
export type {SystemPrompt} from "./system.prompt";
export type {Application} from "./application";
export type {Organization} from "./organization";
export type {Token} from "./token";
export type {User} from "./user";
export * from './stats';

export type OrgCacheMap = {
    applications: Application,
    providers: Provider,
}

export type OrgCacheType = keyof OrgCacheMap;

export type OrgCacheEntity = Application | User | Provider;

export type Keyable<T> = {
    [K in keyof T]-?: T[K] extends string | number ? K : never
}[keyof T] & string;
