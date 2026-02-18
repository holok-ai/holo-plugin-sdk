import {NotificationEvent, NotificationSubscribeFilter} from "./types";

import {AsyncEventQueue} from "../core";

export type NotificationSub = {
    id: string;
    filter: NotificationSubscribeFilter;
    q: AsyncEventQueue<NotificationEvent>;
};

export const NotificationFanoutToken = Symbol("NotificationFanout");

export interface NotificationFanout {
    publish(event: NotificationEvent): Promise<void>;

    subscribe(filter: NotificationSubscribeFilter): Promise<NotificationSub>;

    unsubscribe(id: string): Promise<boolean>
}