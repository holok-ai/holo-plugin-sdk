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
