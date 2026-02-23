import {NotificationEvent, NotificationQuery} from "./types";

export interface NotificationStore {
    query(params: NotificationQuery): Promise<NotificationEvent[]>;

    insert(event: NotificationEvent): Promise<void>;
}

export const NotificationStoreToken = Symbol("NotificationStore");
