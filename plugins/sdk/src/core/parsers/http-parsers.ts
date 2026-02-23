import {clamp, parseNumber} from "./parsers";

export function parseRepeatableParam(q: unknown): string | undefined {
    // Express can give string | string[] | undefined
    if (Array.isArray(q)) return q.join(","); // merge to reuse parseArray
    if (typeof q === "string") return q;
    return undefined;
}

export function parseLimit(q: unknown, def = 250): number {
    const n = parseNumber(parseRepeatableParam(q), def);
    return clamp(n, 1, 1000);
}