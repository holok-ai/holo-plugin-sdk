import {NotificationService, NotificationStore} from '../notification';

export interface INotificationPlugin {
    store?: NotificationStore;     // e.g., Postgres store
    fanout?: NotificationService;   // e.g., Rabbit fanout
}