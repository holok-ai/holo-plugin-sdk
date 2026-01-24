export function findLast<T>(arr: readonly T[], pred: (v: T) => boolean): T | undefined {
    for (let i = arr.length - 1; i >= 0; i--) {
        const v = arr[i];
        if (pred(v)) return v;
    }
    return undefined;
}

export function filterJoin<T>(
    items: readonly T[],
    predicate: (item: T) => boolean,
    toString: (item: T) => string,
    separator = "\n"
): string {
    let out = "";
    for (const item of items) {
        if (!predicate(item)) continue;
        const s = toString(item);
        if (!out) out = s;
        else out += separator + s;
    }
    return out;
}