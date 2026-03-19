type AnyRecord = Record<string, unknown>;

export function pickDefined<T extends object>(obj: T): Partial<T> {
    const out: Partial<T> = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const typedKey = key as keyof T;
            const value = obj[typedKey];
            if (value !== undefined) {
                out[typedKey] = value;
            }
        }
    }

    return out;
}

// export function pickDefined<T extends {}>(obj: T): Partial<T> {
//     return Object.fromEntries(
//         Object.entries(obj).filter(([, v]) => v !== undefined)
//     ) as Partial<T>;
// }

// usage:
export function pickDefinedNonNull<T extends AnyRecord>(obj: T): Partial<T> {
    const out: Partial<T> = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined && value !== null) {
                out[key] = value;
            }
        }
    }

    return out;
}

// usage: const usage = pick(response, ['input_tokens', 'output_tokens'] as const);
export function pick<T extends AnyRecord, K extends keyof T>(
    obj: T,
    keys: readonly K[],
): Pick<T, K> {
    const out = {} as Pick<T, K>;

    for (const key of keys) {
        if (key in obj) {
            out[key] = obj[key];
        }
    }

    return out;
}

// usage: const safe = omit(payload, ['token', 'apiKey'] as const);
export function omit<T extends AnyRecord, K extends keyof T>(
    obj: T,
    keys: readonly K[],
): Omit<T, K> {
    const out = {...obj};
    const keySet = new Set<keyof T>(keys);

    for (const key of Object.keys(out) as Array<keyof T>) {
        if (keySet.has(key)) {
            delete out[key];
        }
    }

    return out as Omit<T, K>;
}

export function pickBy<T extends AnyRecord>(
    obj: T,
    predicate: <K extends keyof T>(value: T[K], key: K) => boolean,
): Partial<T> {
    const out: Partial<T> = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const typedKey = key as keyof T;
            const value = obj[typedKey];
            if (predicate(value, typedKey)) {
                out[typedKey] = value;
            }
        }
    }

    return out;
}

export function omitBy<T extends AnyRecord>(
    obj: T,
    predicate: <K extends keyof T>(value: T[K], key: K) => boolean,
): Partial<T> {
    const out: Partial<T> = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const typedKey = key as keyof T;
            const value = obj[typedKey];
            if (!predicate(value, typedKey)) {
                out[typedKey] = value;
            }
        }
    }

    return out;
}