import {Application} from "./application";
import {User} from "./user";
import {Provider} from "./provider";

export {Provider} from "./provider";
export {Prompt} from "./prompt";
export {Model} from "./model";
export {SystemPromptMode} from "./system.prompt";
export {SystemPrompt} from "./system.prompt";
export {Application} from "./application";
export {Organization} from "./organization";
export {Token} from "./token";
export {User} from "./user";
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
