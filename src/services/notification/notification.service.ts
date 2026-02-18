import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClassLogger,} from "@holokai/sdk";
import {
    NotificationEvent,
    NotificationFanout,
    NotificationIndexer,
    NotificationSub,
    NotificationSubscribeFilter
} from '@holokai/sdk/notification';
import {QueueService} from "../queue.service";
import {env} from "../../env";
import {AsyncEventQueue, IndexMap} from "@holokai/sdk/core";
import {randomUUID} from "node:crypto";

@injectable()
export class NotificationService extends ClassLogger implements NotificationFanout {
    private readonly notificationExchange = env.queue.notificationExchange;
    private readonly notificationQueue = env.queue.notificationQueue;

    private readonly consumers = new Set<string>();
    private readonly subs = new Map<string, NotificationSub>();
    private readonly idx = new IndexMap();

    constructor(private readonly queueService: QueueService) {
        super();
    }

    async startConsumer(organizationId: string): Promise<void> {
        const queueName = `${this.notificationQueue}.${organizationId}`;

        if (this.consumers.has(queueName)) {
            return
        }
        await this.queueService.assertQueue(queueName, {
                durable: true,
                arguments: {
                    'x-expires': env.queue.queueExpiration
                }
            },
            env.queue.notificationExchange,
            organizationId
        );

        await this.queueService.consume(
            queueName,
            async (_id: string, content: any) => this.processNotification(content as NotificationEvent),
            true
        );
        this.consumers.add(queueName);
    }

    async publish(event: NotificationEvent): Promise<void> {
        await this.queueService.sendToExchange(this.notificationExchange, event.organizationId, event, {
            correlationId: event.id,
        });
    }

    async subscribe(filter: NotificationSubscribeFilter): Promise<NotificationSub> {
        const logger = this.mlog(this.subscribe);
        const id = randomUUID();
        const q = new AsyncEventQueue<NotificationEvent>();
        await this.startConsumer(filter.organizationId);

        const sub: NotificationSub = {id, filter, q};
        this.subs.set(id, sub);

        logger.info(JSON.stringify(NotificationIndexer.keysForFilter(filter)));
        for (const k of NotificationIndexer.keysForFilter(filter)) {
            logger.info(`Adding: ${k}`);
            this.idx.add(k, id);
        }
        logger.info(`Indexes ${JSON.stringify(this.idx.size())}`);

        return sub;
    }

    async unsubscribe(id: string): Promise<boolean> {
        const sub = this.subs.get(id);
        if (!sub) return false;

        for (const k of NotificationIndexer.keysForFilter(sub.filter)) this.idx.remove(k, id);

        sub.q.end();
        this.subs.delete(id);
        return true;
    }

    // ---------------- internals ----------------

    private processNotification(ev: NotificationEvent) {
        const logger = this.mlog(this.processNotification);
        logger.info(`Processing notification ${JSON.stringify(ev)}`);

        const keys = NotificationIndexer.keysForEvent(ev);

        logger.info(`keys: ${JSON.stringify(keys)}`);

        // union of all candidate subIds from all relevant keys
        const candidateIds = new Set<string>();
        for (const k of keys) {
            for (const id of this.idx.get(k)) {
                logger.info(`${k}: ${id}`);
                candidateIds.add(id);
            }
        }

        if (!candidateIds.size) return;

        let delivered = 0;
        for (const subId of candidateIds) {
            const sub = this.subs.get(subId);
            if (!sub) continue;
            if (!NotificationIndexer.matches(sub.filter, ev)) continue;
            sub.q.push(ev);
            delivered++;
        }

        logger.debug(`notification delivered`, {
            delivered,
            candidates: candidateIds.size,
            organizationId: ev.organizationId,
            appSlug: ev.appSlug,
            type: ev.type,
        });
    }
}