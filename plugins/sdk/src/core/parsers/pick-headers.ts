export function pickHeadersByPrefix(
    headers: Record<string, string | string[] | undefined>,
    prefixes: string[] = ["anthropic-"]
): Record<string, string> {
    if (!headers) return {};
    const lowerPrefixes = prefixes.map(p => p.toLowerCase());
    const out: Record<string, string> = {};

    for (const [k, v] of Object.entries(headers)) {
        if (v == null) continue;

        const keyLower = k.toLowerCase();
        const matches = lowerPrefixes.some(p => keyLower.startsWith(p));
        if (!matches) continue;

        // Normalize value to string
        out[k] = Array.isArray(v) ? v.join(",") : String(v);
    }

    return out;
}

const BLOCKED_HEADERS = new Set([
    'host',
    'connection',
    'keep-alive',
    'transfer-encoding',
    'upgrade',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
]);

export function filterForwardableHeaders(
    headers: Record<string, string | string[] | undefined>
): Record<string, string> {
    const out: Record<string, string> = {};

    for (const [k, v] of Object.entries(headers)) {
        if (v == null) continue;

        const keyLower = k.toLowerCase();

        if (BLOCKED_HEADERS.has(keyLower)) continue;
        if (keyLower.startsWith('proxy-')) continue;

        out[k] = Array.isArray(v) ? v.join(",") : String(v);
    }

    return out;
}