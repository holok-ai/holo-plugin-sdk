import 'reflect-metadata';
import {injectable} from 'tsyringe';
import Redis from 'ioredis';
import {env} from '../../env';
import {ClassLogger} from "@holokai/sdk";

@injectable()
export class RedisService extends ClassLogger {
    private readonly client: Redis;

    constructor() {
        super();
        const logger = this.mlog(this.constructor);
        this.client = new Redis(env.redis.url, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                return Math.min(times * 200, 5000);
            },
        });

        this.client.on('error', (err) => logger.error('Redis connection error', {error: err.message}));
        this.client.on('connect', () => logger.info('Redis connected'));
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.client.get(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttlSeconds !== undefined) {
            await this.client.set(key, serialized, 'EX', ttlSeconds);
        } else {
            await this.client.set(key, serialized);
        }
    }

    async del(key: string): Promise<boolean> {
        const count = await this.client.del(key);
        return count > 0;
    }

    async keys(pattern: string): Promise<string[]> {
        const result: string[] = [];
        let cursor = '0';
        do {
            const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            result.push(...batch);
        } while (cursor !== '0');
        return result;
    }
}
