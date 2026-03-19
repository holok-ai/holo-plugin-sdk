export function stringifyAny(err: string | Object): string {
    return typeof err === 'string' ? err : JSON.stringify(err);
}
