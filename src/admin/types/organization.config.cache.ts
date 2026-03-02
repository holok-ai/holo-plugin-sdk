import {
    ApplicationConfigProps,
    CacheIndex,
    createCacheIndex,
    IndexMap,
    ixKey,
    OrganizationConfigProps,
    OrgCacheMap,
    OrgCacheType,
    ProviderConfigProps
} from "@holokai/sdk/core";
import {OrganizationValidator} from "../validators";

export class OrganizationConfigCache {
    private providers = new Map<string, ProviderConfigProps>();
    private applications = new Map<string, ApplicationConfigProps>();

    // Replace Map<string, Set<string>> with shared IndexMap
    private readonly providersIdx = new IndexMap();
    private readonly applicationsIdx = new IndexMap();

    private providersIdxDefs: CacheIndex<ProviderConfigProps>[] = [createCacheIndex({field: "id"})];
    private applicationsIdxDefs: CacheIndex<ApplicationConfigProps>[] = [
        createCacheIndex({field: "providerType"}),
    ];

    private readonly caches = new Map<OrgCacheType, Map<string, ProviderConfigProps | ApplicationConfigProps>>();
    private readonly indexes = new Map<OrgCacheType, IndexMap>();
    private readonly indexDefs = new Map<OrgCacheType, CacheIndex<any>[]>();

    id?: string;
    name?: string;
    slug?: string;

    constructor(organization: OrganizationConfigProps) {
        this.caches.set("applications", this.applications);
        this.caches.set("providers", this.providers);
        this.indexes.set("applications", this.applicationsIdx);
        this.indexes.set("providers", this.providersIdx);
        this.indexDefs.set("applications", this.applicationsIdxDefs);
        this.indexDefs.set("providers", this.providersIdxDefs);
        this.init(organization);
    }

    init(organization: OrganizationConfigProps): void {
        const org = OrganizationValidator.assert(organization) as OrganizationConfigProps;
        const {id, name, slug, applications, providers} = org;

        this.id = id;
        this.name = name;
        this.slug = slug;

        if (applications?.length) this.mset("applications", applications, "urlSlug");
        if (providers?.length) this.mset("providers", providers, "name");
    }

    find<K extends OrgCacheType>(
        cacheType: K,
        field: string,
        value: string
    ): OrgCacheMap[K] | OrgCacheMap[K][] | undefined {
        const cache = this.cacheOf(cacheType);
        const idx = this.indexOf(cacheType);

        const ids = idx.get(ixKey(field, value));
        if (!ids.size) return undefined;

        const out: OrgCacheMap[K][] = [];
        for (const id of ids) {
            const v = cache.get(id) as OrgCacheMap[K] | undefined;
            if (v) out.push(v);
        }
        return out.length <= 1 ? out[0] : out;
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

    private addToIndexes(cacheType: OrgCacheType, key: string, value: OrgCacheMap[typeof cacheType]): void {
        const idx = this.indexOf(cacheType);

        for (const def of this.defsOf(cacheType)) {
            const val = def.fn(value);
            if (val === undefined || val === null || val === "") continue;

            const k = ixKey(def.name, String(val));
            idx.add(k, key);
        }
    }

    private removeFromIndexes(cacheType: OrgCacheType, key: string, value: any): void {
        const idx = this.indexOf(cacheType);

        for (const def of this.defsOf(cacheType)) {
            const val = def.fn(value);
            if (val === undefined || val === null || val === "") continue;

            const k = ixKey(def.name, String(val));
            idx.remove(k, key);
        }
    }

    // ----- Helpers -----
    private cacheOf(cacheType: OrgCacheType): Map<string, ProviderConfigProps | ApplicationConfigProps> {
        return this.caches.get(cacheType) as Map<string, ProviderConfigProps | ApplicationConfigProps>;
    }

    private indexOf(cacheType: OrgCacheType): IndexMap {
        return this.indexes.get(cacheType)!;
    }

    private defsOf(cacheType: OrgCacheType): CacheIndex<ApplicationConfigProps | ProviderConfigProps>[] {
        return this.indexDefs.get(cacheType) as CacheIndex<ApplicationConfigProps | ProviderConfigProps>[];
    }
}