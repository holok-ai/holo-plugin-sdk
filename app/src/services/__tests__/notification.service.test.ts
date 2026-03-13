import 'reflect-metadata';
import {NotificationService} from '../notification.service';
import type {NotificationEvent, NotificationSubscribeFilter} from '@holokai/types/notification';

jest.mock('@holokai/sdk', () => ({
    ClassLogger: class {
        mlog() {
            return {
                info: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                debug: jest.fn(),
            };
        }
    },
    pickDefined: (value: Record<string, unknown>) => Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined)
    ),
}));

jest.mock('@holokai/sdk/core', () => ({
    AsyncEventQueue: class AsyncEventQueue<T> implements AsyncIterable<T> {
        private q: T[] = [];
        private pending: ((v: IteratorResult<T>) => void)[] = [];
        private ended = false;

        push(item: T) {
            if (this.ended) return;
            const resolve = this.pending.shift();
            if (resolve) resolve({value: item, done: false});
            else this.q.push(item);
        }

        end() {
            this.ended = true;
            while (this.pending.length) this.pending.shift()!({value: undefined as T, done: true});
        }

        [Symbol.asyncIterator](): AsyncIterator<T> {
            return {
                next: () => {
                    if (this.q.length) return Promise.resolve({value: this.q.shift()!, done: false});
                    if (this.ended) return Promise.resolve({value: undefined as T, done: true});
                    return new Promise<IteratorResult<T>>((resolve) => this.pending.push(resolve));
                },
            };
        }
    },
}));

jest.mock('@holokai/sdk/notification', () => ({
    NotificationTopic: {
        userKey: (orgId: string, userId: string) => `${orgId}.${userId}`,
        userApp: (orgId: string, userId: string, appSlug: string = '*') => `org.${orgId}.user.${userId}.app.${appSlug}`,
        publishKey: (orgId: string, userId: string = 'all', appSlug: string = 'all') => `org.${orgId}.user.${userId}.app.${appSlug}`,
    },
}));

jest.mock('../../env', () => ({
    env: {
        api: {
            apiServerId: 'test-api',
        },
        queue: {
            notificationExchange: 'notifications_exchange',
            notificationQueue: 'notifications',
            queueExpiration: 60_000,
        },
    }
}));

describe('NotificationService', () => {
    const baseFilter: NotificationSubscribeFilter = {
        organizationId: 'org-1',
        userId: 'user-1',
        appSlug: 'app-1',
        threadIds: ['thread-1'],
    };

    const baseEvent: NotificationEvent = {
        id: 'evt-1',
        ts: Date.now(),
        organizationId: 'org-1',
        appSlug: 'app-1',
        userId: 'user-1',
        type: 'request_started',
        severity: 'info',
        message: 'started',
    };

    const createQueueServiceMock = () => {
        let consumer: ((id: string, content: unknown) => Promise<void>) | undefined;

        return {
            queueService: {
                sendToExchange: jest.fn(),
                assertQueue: jest.fn().mockResolvedValue(undefined),
                consume: jest.fn().mockImplementation(async (_queueName, callback) => {
                    consumer = callback;
                    return {consumerTag: 'consumer'};
                }),
                bindQueue: jest.fn().mockResolvedValue(undefined),
                unbindQueue: jest.fn().mockResolvedValue(undefined),
            },
            getConsumer: () => consumer,
        };
    };

    it('binds at app scope and forwards own-user events', async () => {
        const {queueService, getConsumer} = createQueueServiceMock();
        const service = new NotificationService(queueService as any);

        const sub = await service.subscribe(baseFilter);
        const iterator = sub.q[Symbol.asyncIterator]();
        const consumer = getConsumer();
        expect(consumer).toBeDefined();

        expect(queueService.bindQueue).toHaveBeenCalledWith(
            'notifications.org-1.user-1.test-api',
            'notifications_exchange',
            'org.org-1.user.*.app.app-1',
        );

        await consumer!('evt-1', baseEvent);

        await expect(iterator.next()).resolves.toEqual({value: baseEvent, done: false});
    });

    it('forwards matching thread events from other users and blocks unrelated events', async () => {
        const {queueService, getConsumer} = createQueueServiceMock();
        const service = new NotificationService(queueService as any);

        const sub = await service.subscribe(baseFilter);
        const iterator = sub.q[Symbol.asyncIterator]();
        const consumer = getConsumer();
        expect(consumer).toBeDefined();

        const sharedThreadEvent: NotificationEvent = {
            ...baseEvent,
            id: 'evt-2',
            userId: 'user-2',
            threadId: 'thread-1',
        };
        const unrelatedEvent: NotificationEvent = {
            ...baseEvent,
            id: 'evt-3',
            userId: 'user-2',
            threadId: 'thread-2',
        };

        await consumer!('evt-2', sharedThreadEvent);
        await expect(iterator.next()).resolves.toEqual({value: sharedThreadEvent, done: false});

        const pending = iterator.next();
        await consumer!('evt-3', unrelatedEvent);

        await expect(Promise.race([
            pending.then(() => 'received'),
            new Promise((resolve) => setTimeout(() => resolve('timeout'), 25)),
        ])).resolves.toBe('timeout');

        await service.unsubscribe(sub.id);
        await expect(pending).resolves.toEqual({value: undefined, done: true});
    });

    it('always forwards own-user events even when thread filters do not match', async () => {
        const {queueService, getConsumer} = createQueueServiceMock();
        const service = new NotificationService(queueService as any);

        const sub = await service.subscribe({
            ...baseFilter,
            threadIds: ['thread-9'],
            requestIds: ['request-9'],
            branchIds: ['branch-9'],
            types: ['provider_error'],
        });
        const iterator = sub.q[Symbol.asyncIterator]();
        const consumer = getConsumer();
        expect(consumer).toBeDefined();

        const ownEvent: NotificationEvent = {
            ...baseEvent,
            id: 'evt-4',
            threadId: 'thread-1',
            requestId: 'request-1',
            branchId: 'branch-1',
            type: 'request_started',
        };

        await consumer!('evt-4', ownEvent);
        await expect(iterator.next()).resolves.toEqual({value: ownEvent, done: false});
    });
});
