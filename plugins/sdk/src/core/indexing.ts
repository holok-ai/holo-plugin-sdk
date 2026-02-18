// Shared indexing utilities for caches + fanout subs.

import {pickDefined} from "./parsers";

export const SEP = "\x1F";

/** Create a stable composite index key. */
export function ixKey(...parts: Array<string | number | undefined | null>): string {
    // Keep it strict + predictable (no JSON, no escaping). Undefined/null become "".
    return parts.map((p) => (p === undefined || p === null ? "" : String(p))).join(SEP);
}

/**
 * Map indexKey -> Set<id>.
 * Used for secondary indexes and subscriber fanout lookups.
 */
export class IndexMap {
    private readonly map = new Map<string, Set<string>>();
    private static readonly EMPTY: ReadonlySet<string> = new Set();

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

    /** For observability / debugging. */
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
