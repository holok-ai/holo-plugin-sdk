export function safeParse(json?: string): Record<string, unknown> {
    if (!json) return {};
    try {
        return JSON.parse(json);
    } catch {
        return {};
    }
}
