import {AllCacheStats, Keyable, Organization, OrgCacheEntity, OrgCacheType} from "./types";
import NodeCache from "node-cache";
import logger from "../utils/logger";

export class OrganizationCache {
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

    del(cacheType: OrgCacheType, key: string | string[]): number {
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
