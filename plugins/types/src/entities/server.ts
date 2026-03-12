import {BaseEntity} from "./base";
import {Plugin} from "./plugin";

export const ServerType = {
    API: 'api',
    AUDIT: 'audit',
    WORKER: 'worker',
    EVALUATOR: 'evaluator',
    BATCH: 'batch',
}

export type ServerType = typeof ServerType[keyof typeof ServerType];

export interface Server extends BaseEntity {
    id: string;
    name: string;
    type: ServerType
    active: boolean;
    last_online: Date;
    plugins: Plugin[];
}
