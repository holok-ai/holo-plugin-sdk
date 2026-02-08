import {NotificationEvent, NotificationQuery, NotificationSubscribeFilter} from "./types";

export interface NotificationStore {
    query(params: NotificationQuery): Promise<NotificationEvent[]>;

    insert(event: NotificationEvent): Promise<void>;
}

export interface NotificationFanout {
    publish(event: NotificationEvent): Promise<void>;

    subscribe(filter: NotificationSubscribeFilter): AsyncIterable<NotificationEvent>;
}