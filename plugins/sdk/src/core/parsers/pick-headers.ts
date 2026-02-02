export function pickHeadersByPrefix(
    headers: Record<string, string | string[] | undefined>,
    prefixes: string[] = ["anthropic-"]
): Record<string, string> {
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