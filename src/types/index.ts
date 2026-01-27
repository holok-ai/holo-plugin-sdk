export * from '../admin/types/auth.types';
export * from './config.types';
export * from './evaluator.types';
export * from './evaluator-pr.types';
export * from './worker.types';
export * from './worker.request.factory';
export * from './worker.response.factory';


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
