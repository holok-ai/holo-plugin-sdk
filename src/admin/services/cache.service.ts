import 'reflect-metadata';
import {injectable} from 'tsyringe';
import logger from '../../utils/logger';
import {AllCacheStats, Application, Keyable, Organization, OrgCacheEntity, OrgCacheType, User} from "../types";
import NodeCache from "node-cache";

export class OrgCache {
    private readonly caches: Record<OrgCacheType, NodeCache>
    id?: string;
    name?: string;
    slug?: string;

    constructor(organization: Organization) {
        this.caches = {
            users: new NodeCache({
                stdTTL: 600,        // 10 minutes
                checkperiod: 120,   // Check expired keys every 2 minutes
                useClones: false,   // Better performance, be careful with object mutations
                maxKeys: 1000       // Prevent memory issues
            }),
            tokens: new NodeCache({
                stdTTL: 3600,       // 1 hour - matches typical JWT expiration
                checkperiod: 300,   // Check expired keys every 5 minutes
                useClones: false,   // Better performance
                maxKeys: 5000       // Allow more tokens to be cached
            }),
            providers: new NodeCache({
                stdTTL: 0,       // Infinite
                checkperiod: 300,   // Check expired keys every 5 minutes
                useClones: false,   // Better performance
                maxKeys: 5000       // Allow more tokens to be cached
            }),
            applications: new NodeCache({
                stdTTL: 0,       // Infinite
                checkperiod: 300,   // Check expired keys every 5 minutes
                useClones: false,   // Better performance
                maxKeys: 5000       // Allow more tokens to be cached
            })
        } as const satisfies Record<OrgCacheType, NodeCache>;

        this.setupEventListeners();
        this.init(organization);
    }

    init(organization: Organization): void {
        if (organization !== null) {
            const {id, name, slug, applications, providers} = organization;

            this.id = id;
            this.name = name;
            this.slug = slug;

            if (applications?.length > 0) {
                this.mset('applications', applications, 'urlSlug');
            }
            if (providers?.length > 0) {
                this.mset('providers', providers, 'name');
            }
        }
    }

    private setupEventListeners(): void {
        (Object.keys(this.caches) as OrgCacheType[]).forEach((k) => {
            const cache = this.caches[k];
            cache.on('set', (key: string, value: any) => {
                logger.debug(`[${k}] Cache SET: ${key} value: ${value}`);
            });

            cache.on('expired', (key: string) => {
                logger.debug(`[${k}] Cache EXPIRED: ${key}`);
            });

            cache.on('del', (key: string) => {
                logger.debug(`[${k}] Cache DELETE: ${key}`);
            });
        });
    }

    // Generic cache operations
    get<T = any>(cacheType: OrgCacheType, key: string): T | undefined {
        return this.caches[cacheType].get<T>(key);
    }

    set<T = any>(cacheType: OrgCacheType, key: string, value: T): boolean {
        return this.caches[cacheType].set(key, value) ?? false;
    }

    mset<T extends OrgCacheEntity, K extends Keyable<T>>(cacheType: OrgCacheType, values: readonly T[], keyField: K): boolean {
        if (!values?.length) return true;
        const batch = new Array<{ key: string, val: OrgCacheEntity }>(values.length);
        for (let i = 0; i < values.length; i++) {
            const val = values[i]!;
            batch[i] = {key: String(val[keyField]), val}
        }
        return this.caches[cacheType].mset(batch);
    }

    del(cacheType: OrgCacheType, key: string): number {
        return this.caches[cacheType].del(key);
    }

    // Stats for monitoring
    getStats(): AllCacheStats {
        const stats = {} as AllCacheStats;
        (Object.keys(this.caches) as OrgCacheType[]).forEach((k) => {
            const cache = this.caches[k];
            stats[k] = {...cache.getStats(), keys: cache.keys().length};
        });
        return stats;
    }
}


@injectable()
export class CacheService {

    private orgCaches: Record<string, OrgCache>;

    constructor() {


        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        Object.entries(this.caches).forEach(([name, cache]) => {
            cache.on('set', (key: string, value: any) => {
                logger.debug(`[${name}] Cache SET: ${key} value: ${value}`);
            });

            cache.on('expired', (key: string) => {
                logger.debug(`[${name}] Cache EXPIRED: ${key}`);
            });

            cache.on('del', (key: string) => {
                logger.debug(`[${name}] Cache DELETE: ${key}`);
            });
        });
    }

    // Generic cache operations
    get<T = any>(cacheType: OrgCacheType, key: string): T | undefined {
        return this.caches[cacheType]?.get<T>(key);
    }

    set<T = any>(cacheType: OrgCacheType, key: string, value: T): boolean {
        return this.caches[cacheType]?.set(key, value) ?? false;
    }

    setAll<T extends {}>(cacheType: OrgCacheType, values: T[], key: keyof T): boolean {
        let allSucceeded = true;
        if (!values || values.length === 0) return true;
        if (key !== null && key !== '') throw new Error('Key must be provided');

        values.forEach(value => {
            if (!(key in value) || !value[key]) {
                logger.warn(`Value does not contain key: ${key.toString()}`);
                allSucceeded = false;
            } else if (typeof value[key] !== 'string') {
                logger.warn('Value[key] must be a string');
            } else {
                const success = this.set(cacheType, value[key], value);
                if (!success) {
                    logger.error(`Failed to cache value: ${value}`);
                    allSucceeded = false;
                } else {
                    logger.debug(`Cached value: ${value}`);
                }
            }
        });
        return allSucceeded;
    }

    del(cacheType: OrgCacheType, key: string): number {
        return this.caches[cacheType]?.del(key) ?? 0;
    }

    flush(cacheType: OrgCacheType): void {
        this.caches[cacheType]?.flushAll();
    }

    // Specific cache operations
    getUser(userId: string): User | undefined {
        return this.get<User>('users', `user:${userId}`);
    }

    setUser(userId: string, userData: User): boolean {
        return this.set('users', `user:${userId}`, userData);
    }

    getTokenUrlSlugs(jwtToken: string): string[] | undefined {
        const data = this.get<{ urlSlugs: string[] }>('tokens', `token:${jwtToken}`);
        return data?.urlSlugs;
    }

    setTokenUrlSlugs(jwtToken: string, urlSlugs: string[]): boolean {
        return this.set('tokens', `token:${jwtToken}`, {urlSlugs, cachedAt: Date.now()});
    }

    hasToken(jwtToken: string): boolean {
        return this.has('tokens', `token:${jwtToken}`);
    }

    // Application cache operations
    setApplications(applications: Application[]): boolean {
        return this.setAll('applications', applications, 'urlSlug');
    }

    getApplication(urlSlug: string): Application | undefined {
        return this.get<Application>('applications', urlSlug);
    }

    removeApplication(urlSlug: string): boolean {
        const removed = this.del('applications', urlSlug);
        if (removed > 0) {
            logger.debug(`Removed application from cache: ${urlSlug}`);
            return true;
        }
        return false;
    }

    getAllApplications(): Application[] {
        const keys = this.getKeys('applications');
        const applications: Application[] = [];

        keys.forEach(urlSlug => {
            const app = this.getApplication(urlSlug);
            if (app) {
                applications.push(app);
            }
        });

        return applications;
    }

    // Get keys for a specific cache type
    getKeys(cacheType: OrgCacheType): string[] {
        return this.caches[cacheType]?.keys() ?? [];
    }

    // Check if key exists
    has(cacheType: OrgCacheType, key: string): boolean {
        return this.caches[cacheType]?.has(key) ?? false;
    }

    // Graceful shutdown
    close(): void {
        Object.values(this.caches).forEach(cache => cache.close());
    }
}

export default new CacheService();
