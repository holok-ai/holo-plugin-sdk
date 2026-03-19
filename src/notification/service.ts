export const NotificationServiceToken = Symbol("NotificationService");

export class NotificationTopic {

    static userKey(orgId: string, userId: string) {
        return `${orgId}.${userId}`;
    }

    static userApp(orgId: string, userId: string, appSlug: string = '*') {
        return `org.${orgId}.user.${userId}.app.${appSlug}`;
    }

    static publishKey(orgId: string, userId: string = 'all', appSlug: string = 'all') {
        return `org.${orgId}.user.${userId}.app.${appSlug}`;
    }

    static broadcastApp(orgId: string, appSlug: string) {
        return `org.${orgId}.user.all.app.${appSlug}`;
    }
}
