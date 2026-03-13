import express from 'express';
import type {Server} from 'node:http';
import type {IProviderPlugin} from '@holokai/types/plugin';
import type {ProviderEvent} from '@holokai/types/provider';
import type {FixtureScenario, SdkAdapter} from '../fixtures/types.js';

export interface FixtureServerOptions {
    port?: number | undefined;
}

export class HttpFixtureServer {
    private server: Server | null = null;
    private app = express();

    constructor() {
        this.app.use(express.json());
    }

    mount(fixture: FixtureScenario, plugin: IProviderPlugin, adapter: SdkAdapter): void {
        const route = adapter.routes(fixture);
        if (!route) return;

        const handler = async (_req: express.Request, res: express.Response) => {
            const wire = await plugin.createWireAdapter({
                requestId: 'roundtrip-req',
                isStreaming: fixture.streaming,
                protocol: fixture.protocol,
            });

            const events = buildProviderEvents(fixture);
            let headersSent = false;

            for (const evt of events) {
                const chunks = await wire.fromProviderEvent(evt);
                for (const chunk of chunks) {
                    if (chunk.headers && !headersSent) {
                        if (chunk.status) res.status(chunk.status);
                        Object.entries(chunk.headers).forEach(([k, v]) => res.setHeader(k, v));
                        headersSent = true;
                    }
                    if (chunk.body) {
                        res.write(chunk.body);
                    }
                    if (chunk.done) {
                        res.end();
                        return;
                    }
                }
            }

            if (!res.writableEnded) res.end();
        };

        if (route.method === 'POST') {
            this.app.post(route.path, handler);
        } else {
            this.app.get(route.path, handler);
        }
    }

    async start(options?: FixtureServerOptions): Promise<number> {
        const port = options?.port ?? 0;
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, () => {
                const addr = this.server!.address();
                if (typeof addr === 'object' && addr) {
                    resolve(addr.port);
                } else {
                    reject(new Error('Failed to get server address'));
                }
            });
            this.server.on('error', reject);
        });
    }

    async stop(): Promise<void> {
        if (!this.server) return;
        return new Promise((resolve) => {
            this.server!.close(() => resolve());
        });
    }
}

function buildProviderEvents(fixture: FixtureScenario): ProviderEvent[] {
    return fixture.providerChunks.map((chunk, i) => {
        const isLast = i === fixture.providerChunks.length - 1;
        if (isLast) {
            return {
                type: 'done',
                requestId: 'roundtrip-req',
                seq: i,
                message: chunk,
                text: fixture.expectedText,
                ts: Date.now(),
            } as ProviderEvent;
        }
        return {
            type: 'stream_event',
            requestId: 'roundtrip-req',
            seq: i,
            event: chunk,
            ts: Date.now(),
        } as ProviderEvent;
    });
}
