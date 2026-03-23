import {beforeAll, describe, expect, it} from 'vitest';
import {HoloApiError, HoloClient} from '../../src/client';
import type {DiscoveredProvider} from '@holokai/holo-test';
import {discoverProviders, getTestConfig} from '@holokai/holo-test';
import type {HoloResponse, HoloStreamEvent} from '@holokai/holo-types/holo';

function client() {
    const {gatewayUrl, token} = getTestConfig();
    console.log(`\n  Gateway: ${gatewayUrl}`);
    return new HoloClient({baseUrl: gatewayUrl, token});
}

function printResponse(label: string, res: HoloResponse) {
    console.log(`\n  ── ${label} ──`);
    console.log(`  id:            ${res.id}`);
    console.log(`  model:         ${res.model}`);
    console.log(`  finish_reason: ${res.finish_reason}`);
    if (res.usage) {
        console.log(`  usage:         input=${res.usage.input_tokens} output=${res.usage.output_tokens} total=${res.usage.total_tokens}`);
    }
    for (const msg of res.output ?? []) {
        const text = typeof msg.content === 'string'
            ? msg.content
            : Array.isArray(msg.content)
                ? msg.content.map((c: any) => c.text ?? JSON.stringify(c)).join('')
                : JSON.stringify(msg.content);
        console.log(`  output [${msg.role}]: ${text}`);
    }
}

function skipIfNotConfigured(e: unknown): void {
    if (e instanceof HoloApiError && [400, 404, 429].includes(e.status)) {
        console.log(`  SKIPPED: ${e.status} ${e.message}`);
        return;
    }
    throw e;
}

let discovered: DiscoveredProvider[] = [];

beforeAll(async () => {
    discovered = await discoverProviders(client());
    console.log(`Discovered providers: ${discovered.map(d => `${d.family}(${d.model})`).join(', ')}`);
});

describe('live verbose: streaming & non-streaming', () => {
    for (const [family, _protocols] of Object.entries({openai: true, claude: true, gemini: true, ollama: true})) {
        describe(family, () => {
            const getProvider = () => discovered.find(d => d.family === family);

            it(`non-streaming`, async () => {
                const provider = getProvider();
                if (!provider) return console.log(`  SKIPPED: ${family} not available`);

                const c = client();
                console.log(`  model: ${provider.model}`);

                try {
                    const res = await c.chat.create({
                        model: provider.model,
                        messages: [{role: 'user', content: 'What is 2+2? Answer in one sentence.'}],
                        max_tokens: 1024,
                    });

                    printResponse('Response', res);
                    expect(res.id).toBeTruthy();
                    expect(res.output.length).toBeGreaterThan(0);
                } catch (e) {
                    skipIfNotConfigured(e);
                }
            });

            it(`streaming (all events)`, async () => {
                const provider = getProvider();
                if (!provider) return console.log(`  SKIPPED: ${family} not available`);

                const c = client();
                console.log(`  model: ${provider.model}`);

                try {
                    const stream = await c.chat.stream({
                        model: provider.model,
                        messages: [{role: 'user', content: 'Write a haiku about programming.'}],
                        max_tokens: 1024,
                    });

                    const events: HoloStreamEvent[] = [];

                    for await (const event of stream) {
                        events.push(event);
                        if (event.type === 'response.output_text.delta') {
                            process.stdout.write(event.delta ?? '');
                        }
                    }

                    console.log(`\n\n  ── Stream Summary ──`);
                    console.log(`  events received: ${events.length}`);
                    console.log(`  event types:     ${[...new Set(events.map(e => e.type))].join(', ')}`);

                    for (const event of events) {
                        console.log(`  event: ${JSON.stringify(event).slice(0, 200)}`);
                    }

                    const completed = events.find(e => e.type === 'response.completed');
                    if (completed?.type === 'response.completed' && completed.response) {
                        printResponse('Final Response', completed.response);
                    }

                    expect(events.length).toBeGreaterThan(0);
                } catch (e) {
                    skipIfNotConfigured(e);
                }
            });

            it(`streaming with .on() + finalResponse`, async () => {
                const provider = getProvider();
                if (!provider) return console.log(`  SKIPPED: ${family} not available`);

                const c = client();
                console.log(`  model: ${provider.model}`);

                try {
                    const stream = await c.chat.stream({
                        model: provider.model,
                        messages: [{role: 'user', content: 'Name three colors. One word each, comma separated.'}],
                        max_tokens: 1024,
                    });

                    const chunks: string[] = [];
                    stream.on('response.output_text.delta', (text) => {
                        chunks.push(text);
                        process.stdout.write(text);
                    });

                    const res = await stream.finalResponse();
                    console.log('');
                    printResponse('Final Response', res);
                    console.log(`  delta chunks received: ${chunks.length}`);

                    expect(res.output.length).toBeGreaterThan(0);
                } catch (e) {
                    skipIfNotConfigured(e);
                }
            });
        });
    }
});

describe('live verbose: models & applications', () => {
    it('list models', async () => {
        const c = client();
        const models = await c.models.list();
        console.log(`\n  ── Available Models (${models.length}) ──`);
        for (const m of models) {
            console.log(`  ${m.id} ${m.name} [${m.provider_family}] caps=${m.capabilities.join(',')} ctx=${m.context_length ?? '?'}`);
        }
        expect(models.length).toBeGreaterThan(0);
    });

    it('list applications', async () => {
        const c = client();
        const apps = await c.applications.list();
        console.log(`\n  ── Applications (${apps.length}) ──`);
        for (const app of apps) {
            console.log(`  ${app.slug} — ${app.name} [${app.provider_family}] model=${app.default_model ?? 'none'} guards=${app.has_guards} prompt=${app.has_system_prompt}`);
        }
        expect(apps.length).toBeGreaterThan(0);
    });
});
