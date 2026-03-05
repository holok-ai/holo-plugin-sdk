export function uint8ToDataUrl(bytes: Uint8Array, mime = "image/png"): string {
    return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function isUint8Array(value: any): value is Uint8Array {
    return value &&
        typeof value === 'object' &&
        typeof value.byteLength === 'number' &&
        typeof value.buffer === 'object' &&
        value.constructor?.name === 'Uint8Array';
}
