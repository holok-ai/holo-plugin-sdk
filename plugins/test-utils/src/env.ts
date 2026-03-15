export const hasGateway = !!process.env['HOLO_URL'];

export function gatewayUrl(): string {
    let url = process.env['HOLO_URL'];
    if (!url) throw new Error('HOLO_URL not set');
    url = url.replace(/\/+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
    }
    return url;
}

export function getTestConfig(): {gatewayUrl: string; token: string} {
    return {
        gatewayUrl: gatewayUrl(),
        token: process.env['HOLO_TEST_TOKEN'] ?? '',
    };
}
