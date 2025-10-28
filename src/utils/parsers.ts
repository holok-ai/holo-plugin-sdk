// Helper function to parse boolean environment variables
export function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
}

// Helper function to parse number environment variables
export function parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

// Helper function to parse array environment variables
export function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
}

// helper: Uint8Array -> data URL
export function uint8ToDataUrl(bytes: Uint8Array, mime = "image/png"): string {
    return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

// Check if it has the properties/methods of a Uint8Array
export function isUint8Array(value: any): value is Uint8Array {
    return value &&
        typeof value === 'object' &&
        typeof value.byteLength === 'number' &&
        typeof value.buffer === 'object' &&
        value.constructor?.name === 'Uint8Array';
}
