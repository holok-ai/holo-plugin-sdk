import {clamp, parseNumber} from "./env.parsers";

export function parseRepeatableParam(q: unknown): string | undefined {
    if (Array.isArray(q)) return q.join(",");
    if (typeof q === "string") return q;
    return undefined;
}

export function parseLimit(q: unknown, def = 250): number {
    const n = parseNumber(parseRepeatableParam(q), def);
    return clamp(n, 1, 1000);
}
