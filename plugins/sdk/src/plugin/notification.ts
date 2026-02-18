import {NotificationFanout, NotificationStore} from '../notification';

export interface INotificationPlugin {
    store?: NotificationStore;     // e.g., Postgres store
    fanout?: NotificationFanout;   // e.g., Rabbit fanout
}