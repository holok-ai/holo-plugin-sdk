import {
    ApplicationConfigProps,
    Keyable,
    OrganizationConfigProps,
    OrgCacheMap,
    OrgCacheType,
    ProviderConfigProps
} from "@holokai/sdk/core";
import {OrganizationValidator} from "./validators";

const SEP = '\x1F';
const ixKey = (field: string, value: string) => `${field}${SEP}${value}`;

export interface CacheFieldIndex<T> {
    field: Keyable<T>;
    multi?: boolean;
    name?: string;
}

export function createCacheIndex<T>(def: CacheFieldIndex<T>): CacheIndex<T> {
    const {field, name, ...rest} = def;
    return {
        name: name || field,
        fn: (val: T) => val[field] as string,
        ...rest
    }
}


export interface CacheIndex<T> {
    name: string;
    multi?: boolean;
    fn: (val: T) => string;
}

export class OrganizationCache {
    private providers = new Map<string, ProviderConfigProps>();
    private applications = new Map<string, ApplicationConfigProps>();

    private providersIdx = new Map<string, Set<string>>();
    private applicationsIdx = new Map<string, Set<string>>();

    private providersIdxDefs: CacheIndex<ProviderConfigProps>[] = [createCacheIndex({field: 'id'})];
    private applicationsIdxDefs: CacheIndex<ApplicationConfigProps>[] = [createCacheIndex({field: 'providerType'})];


    private readonly caches = new Map<OrgCacheType, Map<String, ProviderConfigProps | ApplicationConfigProps>>
    private readonly indexes = new Map<OrgCacheType, Map<string, string | Set<string>>>();
    private readonly indexDefs = new Map<OrgCacheType, CacheIndex<ApplicationConfigProps>[] | CacheIndex<ProviderConfigProps>[]>();

    id?: string;
    name?: string;
    slug?: string;

    constructor(organization: OrganizationConfigProps) {
        this.caches.set('applications', this.applications);
        this.caches.set('providers', this.providers);
        this.indexes.set('applications', this.applicationsIdx);
        this.indexes.set('providers', this.providersIdx);
        this.indexDefs.set('applications', this.applicationsIdxDefs);
        this.indexDefs.set('providers', this.providersIdxDefs);
        this.init(organization);
    }

    init(organization: OrganizationConfigProps): void {
        const org = OrganizationValidator.assert(organization);
        const {id, name, slug, applications, providers} = org;

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

    find<K extends OrgCacheType>(cacheType: K, field: string, value: string): OrgCacheMap[K] | OrgCacheMap[K][] | undefined {
        const cache = this.cacheOf(cacheType);
        const idx = this.indexOf(cacheType);
        const idxKey = ixKey(field, value);
        const ids = idx.get(idxKey);

        if (ids) {
            if (ids instanceof Set) {
                const results: OrgCacheMap[K][] = [];
                for (const id of ids) {
                    const result = cache.get(id) as OrgCacheMap[K] | undefined;
                    if (result) results.push(result);
                }
                return results;
            } else {
                return cache.get(ids) as OrgCacheMap[K] | undefined;
            }
        }
        return undefined;
    }

    getAll<K extends OrgCacheType>(cacheType: K): OrgCacheMap[K][] {
        return Array.from(this.cacheOf(cacheType).values()) as unknown as OrgCacheMap[K][];
    }

    // ----- Generic operations -----
    get<K extends OrgCacheType>(cacheType: K, key: string): OrgCacheMap[K] | undefined {
        return this.cacheOf(cacheType).get(key) as OrgCacheMap[K] | undefined;
    }

    set<K extends OrgCacheType>(cacheType: K, key: string, value: OrgCacheMap[K]): void {
        const m = this.cacheOf(cacheType);
        const prev = m.get(key) as OrgCacheMap[K] | undefined;
        if (prev) this.removeFromIndexes(cacheType, key, prev);
        m.set(key, value as any);
        this.addToIndexes(cacheType, key, value);
    }

    mset<K extends OrgCacheType, T extends OrgCacheMap[K], F extends keyof T & string>(
        cacheType: K,
        values: readonly T[],
        keyField: F
    ): void {
        for (let i = 0; i < values.length; i++) {
            const v = values[i]!;
            this.set(cacheType, String(v[keyField]), v);
        }
    }

    del(cacheType: OrgCacheType, key: string): boolean {
        const m = this.cacheOf(cacheType);
        const existing = m.get(key) as OrgCacheMap[typeof cacheType] | undefined;
        if (!existing) return false;
        this.removeFromIndexes(cacheType, key, existing);
        return m.delete(key);
    }

    mdel(cacheType: OrgCacheType, keys: readonly string[]): { success: boolean; failed: string[] } {
        const failed: string[] = [];
        for (const key of keys) if (this.del(cacheType, key)) failed.push(key);
        return {success: failed.length === 0, failed};
    }

    clear(cacheType: OrgCacheType): void {
        this.cacheOf(cacheType).clear();
    }

    has(cacheType: OrgCacheType, key: string): boolean {
        return this.cacheOf(cacheType).has(key);
    }

    // ----- Admin / monitoring -----
    getStats() {
        return {
            applications: {size: this.applications.size},
            providers: {size: this.providers.size},
        };
    }

    snapshot() {
        return {
            applications: Object.fromEntries(this.applications),
            providers: Object.fromEntries(this.providers),
        };
    }

    private addToIndexes(cacheType: OrgCacheType, key: string, value: OrgCacheMap[typeof cacheType]): void {
        const idx = this.indexOf(cacheType);

        for (const def of this.defsOf(cacheType)) {
            let {name, fn, multi} = def;

            const val = fn(value);
            const idxKey = ixKey(name, val);
            if (!multi) {
                idx.set(idxKey, key)
            } else {
                let set = idx.get(key);
                if (!set) {
                    set = new Set<string>();
                    idx.set(key, set);
                } else if (!(set instanceof Set)) {
                    set = new Set<string>([set as string]);
                }
                set.add(key);
            }
        }
    }

    private removeFromIndexes(cacheType: OrgCacheType, key: string, value: OrgCacheMap[typeof cacheType]): void {
        const idx = this.indexOf(cacheType);
        for (const def of this.defsOf(cacheType)) {
            let {name, fn, multi} = def;

            const val = fn(value);
            const idxKey = ixKey(name, val);
            if (!multi) {
                idx.delete(idxKey)
            } else {
                let set = idx.get(key);
                if (set) {
                    if (set instanceof Set) {
                        set.delete(key);
                        if (set.size === 0) {
                            idx.delete(key);
                        }
                    }
                }
            }
        }
    }

    // ----- Helpers -----
    private cacheOf(cacheType: OrgCacheType): Map<string, ProviderConfigProps | ApplicationConfigProps> {
        return this.caches.get(cacheType) as Map<string, ProviderConfigProps | ApplicationConfigProps>;
    }

    private indexOf(cacheType: OrgCacheType): Map<string, string | Set<string>> {
        return this.indexes.get(cacheType) as Map<string, string | Set<string>>;
    }

    private defsOf(cacheType: OrgCacheType): CacheIndex<ApplicationConfigProps | ProviderConfigProps>[] {
        return this.indexDefs.get(cacheType) as CacheIndex<ApplicationConfigProps | ProviderConfigProps>[];
    }
}
