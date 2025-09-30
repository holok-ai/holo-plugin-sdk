export * from '../admin/types/auth.types';
export * from './config.types';
export * from './evaluator.types';
export * from './evaluator-pr.types';
export * from './mixin.types';
export * from './worker.request.types';


export enum AnnouncementType {
    PROXY = 'PROXY',
    WORKER = 'WORKER',
    AUDIT = 'AUDIT'
}

export interface AnnouncementMessage {
    type: AnnouncementType;
    serverId: string;
    timestamp: string;
}
