export function stringifyError(err: string | Error): string {
    return typeof err === 'string' ? err : JSON.stringify(err);
}
