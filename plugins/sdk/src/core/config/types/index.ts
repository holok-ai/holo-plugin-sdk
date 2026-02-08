import type {ApplicationConfigProps} from "./application";
import type {ProviderConfigProps} from "./provider";

export type {ProviderConfigProps} from "./provider";
export type {PromptConfigProps} from "./prompt";
export type {ModelConfigProps} from "./model";
export {SystemPromptMode} from "./system.prompt";
export type {SystemPrompt} from "./system.prompt";
export type {ApplicationConfigProps} from "./application";
export type {OrganizationConfigProps} from "./organization";
export type {Token} from "./token";
export type {UserConfigProps} from "./user";

export type OrgCacheMap = {
    applications: ApplicationConfigProps,
    providers: ProviderConfigProps,
}

export type OrgCacheType = keyof OrgCacheMap;

export type Keyable<T> = {
    [K in keyof T]-?: T[K] extends string | number ? K : never
}[keyof T] & string;
