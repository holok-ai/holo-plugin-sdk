import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClassLogger, pickDefined,} from "@holokai/sdk";
import type {
    INotificationService,
    INotificationSub,
    NotificationEvent,
    NotificationSubscribeFilter
} from '@holokai/types/notification';
import {NotificationTopic} from '@holokai/sdk/notification';
import {QueueService} from "./queue.service";
import {env} from "../env";
import {AsyncEventQueue} from "@holokai/sdk/core";
import {randomUUID} from "node:crypto";

interface InternalNotificationSub extends INotificationSub {
    q: AsyncEventQueue<NotificationEvent>;
}

@injectable()
export class NotificationService extends ClassLogger implements INotificationService {
    private readonly exchange = env.queue.notificationExchange;
    private readonly queuePrefix = env.queue.notificationQueue;

    private consumers = new Map<string, { queueName: string; started: boolean }>();

    private bindingRefs = new Map<string, Map<string, number>>();

    private subs = new Map<string, Map<string, InternalNotificationSub>>();

    constructor(private readonly queueService: QueueService) {
        super();
    }

    async publish(event: NotificationEvent): Promise<void> {
        const logger = this.mlog(this.publish);
        const rk = NotificationTopic.publishKey(event.organizationId, event.userId, event.appSlug);
        logger.info(`Publishing notification: type=${event.type}, severity=${event.severity}, routingKey=${rk}, eventId=${event.id}`);
        await this.queueService.sendToExchange(this.exchange, rk, event, {
            correlationId: event.id,
        });
    }

    async subscribe(filter: NotificationSubscribeFilter): Promise<INotificationSub> {
        const {organizationId, userId, appSlug} = filter;

        if (!organizationId || !userId) {
            throw new Error('Notification subscription requires organizationId and userId');
        }


        const userKey = NotificationTopic.userKey(organizationId, userId);
        const id = randomUUID();
        const q = new AsyncEventQueue<NotificationEvent>();

        await this.ensureUserQueueConsumer(userKey);

        const bindingKey = NotificationTopic.userApp(organizationId, '*', appSlug);
        await this.addBindingRef(userKey, bindingKey);

        let m = this.subs.get(userKey);
        if (!m) this.subs.set(userKey, (m = new Map()));

        const sub = pickDefined({id, filter, q, appSlug}) as InternalNotificationSub;
        m.set(id, sub);
        return sub;
    }


    async unsubscribe(id: string): Promise<boolean> {
        for (const [userKey, subs] of this.subs.entries()) {
            const sub = subs.get(id);
            if (!sub) continue;

            subs.delete(id);
            sub.q.end();

            const {organizationId, appSlug} = sub.filter;
            await this.releaseBindingRef(userKey, NotificationTopic.userApp(organizationId, '*', appSlug));

            if (subs.size === 0) {
                this.subs.delete(userKey);
            }

            return true;
        }
        return false;
    }

    private async ensureUserQueueConsumer(userKey: string) {
        const existing = this.consumers.get(userKey);
        if (existing?.started) return;

        const queueName = `${this.queuePrefix}.${userKey}.${env.api.apiServerId}`;

        await this.queueService.assertQueue(
            queueName,
            {
                durable: true,
                arguments: {"x-expires": env.queue.queueExpiration},
            }
        );

        await this.queueService.consume(
            queueName,
            async (_id: string, content: any) => this.fanoutToUser(userKey, content as NotificationEvent),
            true
        );

        this.consumers.set(userKey, {queueName, started: true});
        const logger = this.mlog(this.ensureUserQueueConsumer);
        logger.info(`Notification consumer started: userKey=${userKey}, queue=${queueName}`);
    }

    private async addBindingRef(userKey: string, binding: string) {
        let m = this.bindingRefs.get(userKey);
        if (!m) this.bindingRefs.set(userKey, (m = new Map()));

        const n = (m.get(binding) ?? 0) + 1;
        m.set(binding, n);
        if (n > 1) return;

        const c = this.consumers.get(userKey);
        if (!c) throw new Error(`No queue for ${userKey}`);

        await this.queueService.bindQueue(c.queueName, this.exchange, binding);
    }

    private async releaseBindingRef(userKey: string, binding: string) {
        const m = this.bindingRefs.get(userKey);
        if (!m) return;

        const n = (m.get(binding) ?? 0) - 1;
        if (n > 0) {
            m.set(binding, n);
            return;
        }

        m.delete(binding);
        if (m.size === 0) this.bindingRefs.delete(userKey);

        const c = this.consumers.get(userKey);
        if (!c) return;

        await this.queueService.unbindQueue(c.queueName, this.exchange, binding);
    }

    private fanoutToUser(userKey: string, ev: NotificationEvent) {
        const logger = this.mlog(this.fanoutToUser);
        const subs = this.subs.get(userKey);
        if (!subs || subs.size === 0) {
            logger.info(`No SSE subscribers for userKey=${userKey}, event type=${ev.type} dropped`);
            return;
        }

        let notified = 0;
        for (const sub of subs.values()) {
            if (!this.matchesFilter(sub.filter, ev)) continue;
            sub.q.push(ev);
            notified++;
        }
        logger.info(`Fanout: type=${ev.type}, userKey=${userKey}, totalSubs=${subs.size}, notified=${notified}`);
    }

    private matchesFilter(filter: NotificationSubscribeFilter, ev: NotificationEvent): boolean {
        if (ev.organizationId !== filter.organizationId) return false;
        if (filter.appSlug && ev.appSlug !== filter.appSlug) return false;

        const matchesUser = filter.userId ? ev.userId === filter.userId : false;
        if (matchesUser) return true;

        const matchesThread = !!ev.threadId && !!filter.threadIds?.includes(ev.threadId);
        if (!matchesThread) return false;
        if (filter.requestIds?.length && (!ev.requestId || !filter.requestIds.includes(ev.requestId))) return false;
        if (filter.branchIds?.length && (!ev.branchId || !filter.branchIds.includes(ev.branchId))) return false;
        if (filter.types?.length && !filter.types.includes(ev.type)) return false;

        return true;
    }

}
