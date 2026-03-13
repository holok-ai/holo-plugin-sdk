export function parseNdjsonBody(body: string): any[] {
    return body
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
}
