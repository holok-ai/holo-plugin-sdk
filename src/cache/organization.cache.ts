import {Application, Organization, OrgCacheMap, OrgCacheType, Provider} from "./types";
import {OrganizationValidator} from "./validators";

export class OrganizationCache {
    private providers = new Map<string, Provider>();
    private applications = new Map<string, Application>();
    id?: string;
    name?: string;
    slug?: string;

    constructor(organization: Organization) {
        this.init(organization);
    }

    init(organization: Organization): void {
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

    getAll<K extends OrgCacheType>(bucket: K): OrgCacheMap[K][] {
        return this.mapOf(bucket).values().toArray() as unknown as OrgCacheMap[K][];
    }

    // ----- Generic operations -----
    get<K extends OrgCacheType>(bucket: K, key: string): OrgCacheMap[K] | undefined {
        return this.mapOf(bucket).get(key) as OrgCacheMap[K] | undefined;
    }

    set<K extends OrgCacheType>(bucket: K, key: string, value: OrgCacheMap[K]): void {
        this.mapOf(bucket).set(key, value as any);
    }

    mset<K extends OrgCacheType, T extends OrgCacheMap[K], F extends keyof T & string>(
        bucket: K,
        values: readonly T[],
        keyField: F
    ): void {
        const m = this.mapOf(bucket);
        for (let i = 0; i < values.length; i++) {
            const v = values[i]!;
            m.set(String(v[keyField]), v as any);
        }
    }

    del(bucket: OrgCacheType, key: string | string[]): boolean {
        if (Array.isArray(key)) {
            return this.mdel(bucket, key).success;
        }
        return this.mapOf(bucket).delete(key);
    }

    mdel(bucket: OrgCacheType, keys: string[]): { success: boolean; failed: string[] } {
        const failed: string[] = [];
        const m = this.mapOf(bucket);
        for (const key of keys) if (!m.delete(key)) failed.push(key);
        return {success: failed.length === 0, failed};
    }

    clear(bucket: OrgCacheType): void {
        this.mapOf(bucket).clear();
    }

    has(bucket: OrgCacheType, key: string): boolean {
        return this.mapOf(bucket).has(key);
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

    // ----- Helpers -----
    private mapOf(bucket: OrgCacheType): Map<string, unknown> {
        switch (bucket) {
            case 'applications':
                return this.applications as unknown as Map<string, Application>;
            case 'providers':
                return this.providers as unknown as Map<string, Provider>;
        }
    }
}
