import {HoloClient, HoloApiError} from '../../src/client';
import {discoverProviders, getTestConfig} from '@holokai/holo-test';
import type {DiscoveredProvider} from '@holokai/holo-test';

let discovered: DiscoveredProvider[] | null = null;

export async function getProviders(): Promise<DiscoveredProvider[]> {
    if (!discovered) {
        const {gatewayUrl, token} = getTestConfig();
        const client = new HoloClient({baseUrl: gatewayUrl, token});
        discovered = await discoverProviders(client);
    }
    return discovered;
}

export async function getModel(family?: string): Promise<string> {
    const providers = await getProviders();
    if (family) {
        const match = providers.find(p => p.family === family);
        if (match) return match.model;
    }
    const first = providers[0];
    if (!first) throw new Error('No providers discovered from gateway');
    return first.model;
}

export function client(): HoloClient {
    const {gatewayUrl, token} = getTestConfig();
    return new HoloClient({baseUrl: gatewayUrl, token});
}

export function skipOnRateLimit(e: unknown): void {
    if (e instanceof HoloApiError && [400, 404, 429].includes(e.status)) return;
    throw e;
}
