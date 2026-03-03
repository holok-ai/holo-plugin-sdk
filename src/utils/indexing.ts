import {pickDefined} from "@holokai/sdk";

export const SEP = "\x1F";

export function ixKey(...parts: Array<string | number | undefined | null>): string {
    return parts.map((p) => (p === undefined || p === null ? "" : String(p))).join(SEP);
}

export class IndexMap {
    private static readonly EMPTY: ReadonlySet<string> = new Set();
    private readonly map = new Map<string, Set<string>>();

    add(indexKey: string, id: string): void {
        let set = this.map.get(indexKey);
        if (!set) this.map.set(indexKey, (set = new Set()));
        set.add(id);
    }

    remove(indexKey: string, id: string): void {
        const set = this.map.get(indexKey);
        if (!set) return;
        set.delete(id);
        if (set.size === 0) this.map.delete(indexKey);
    }

    get(indexKey: string): ReadonlySet<string> {
        return this.map.get(indexKey) ?? IndexMap.EMPTY;
    }

    delete(indexKey: string): void {
        this.map.delete(indexKey);
    }

    clear(): void {
        this.map.clear();
    }

    size(): number {
        return this.map.size;
    }
}

export interface CacheFieldIndex<T> {
    field: Keyable<T>;
    multi?: boolean;
    name?: string;
}

export interface CacheIndex<T> {
    name: string;
    multi?: boolean;
    fn: (val: T) => string | undefined | null;
}

export function createCacheIndex<T>(def: CacheFieldIndex<T>): CacheIndex<T> {
    const {field, name, multi} = def;
    return pickDefined({
        name: name || field,
        multi,
        fn: (val: T) => (val as any)?.[field] as any,
    }) as CacheIndex<T>;
}

export type Keyable<T> = {
    [K in keyof T]-?: T[K] extends string | number ? K : never
}[keyof T] & string;
