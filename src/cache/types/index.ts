import NodeCache from "node-cache";
import {Application} from "./application";
import {User} from "./user";
import {Provider} from "./provider";

export * from './loader.types';
export * from '../../admin/types/config.types';
export {Provider} from "./provider";
export {Evaluator} from "./evaluator";
export {Guard} from "./guard";
export {Model} from "./model";
export {SystemPrompt} from "./system.prompt";
export {SystemPromptMode} from "./system.prompt";
export {Application} from "./application";
export {Organization} from "./organization";
export {Token} from "./token";
export {User} from "./user";
export * from './stats';

type CacheMap = Record<string, NodeCache>

export interface OrgCacheMap extends CacheMap {
    users: NodeCache;
    providers: NodeCache;
    applications: NodeCache;
}

export type OrgCacheType = keyof OrgCacheMap;

export type OrgCacheEntity = Application | User | Provider;

export type Keyable<T> = {
    [K in keyof T]-?: T[K] extends string | number ? K : never
}[keyof T] & string;
