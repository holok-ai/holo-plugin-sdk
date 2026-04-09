import 'reflect-metadata';
import {appendFileSync, mkdirSync} from 'fs';
import {resolve} from 'path';
import {beforeAll, describe, expect, it} from 'vitest';
import {container} from 'tsyringe';
import type {HoloLogger} from '@holokai/holo-types/logger';
import {ProtocolCapability} from '@holokai/holo-types/entities';
import {loadAllPlugins} from '@holokai/holo-sdk/plugin';
import {HoloApiError, HoloClient} from '../../src/client';
import type {DiscoveredProvider} from '@holokai/holo-test';
import {discoverProviders, getTestConfig} from '@holokai/holo-test';

const logDir = process.env.LOG_DIR || resolve(import.meta.dirname, '../../../../logs');
mkdirSync(logDir, {recursive: true});
const logFile = resolve(logDir, 'test-output.log');

function log(...args: any[]) {
    const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a, null, 2)).join(' ');
    appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`);
}

interface FamilyProtocols {
    chat: string[];
    generate: string[];
    embed: string[];
    metrics: string[];
}

const noop = () => {
};
const noopLogger = {
    level: 'silent',
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    verbose: noop,
    child: () => noopLogger
} as unknown as HoloLogger;
container.register('LoggerFactory', {useValue: () => noopLogger});

const plugins = await loadAllPlugins();
const familyProtocols = new Map<string, FamilyProtocols>();

for (const [family, plugin] of plugins) {
    const fp: FamilyProtocols = {chat: [], generate: [], embed: [], metrics: []};
    for (const route of plugin.getRoutes()) {
        const cap = route.protocol.capability;
        if (cap === ProtocolCapability.CHAT) fp.chat.push(route.protocol.name);
        else if (cap === ProtocolCapability.GENERATE) fp.generate.push(route.protocol.name);
        else if (cap === ProtocolCapability.EMBED) fp.embed.push(route.protocol.name);
        else if (cap === ProtocolCapability.METRICS) fp.metrics.push(route.protocol.name);
    }
    familyProtocols.set(family, fp);
}

log('Discovered protocols:', Object.fromEntries(familyProtocols));

function client() {
    const {gatewayUrl, token} = getTestConfig();
    return new HoloClient({baseUrl: gatewayUrl, token});
}

function handleError(protocol: string, e: unknown) {
    if (e instanceof HoloApiError && [400, 404, 429].includes(e.status)) {
        log(`[${protocol}] SKIPPED: ${e.status} ${e.message}`);
        return;
    }
    if (e instanceof HoloApiError) {
        log(`[${protocol}] HoloApiError: ${e.status} ${e.message}`, e.body);
    }
    throw e;
}

let discovered: DiscoveredProvider[] = [];

beforeAll(async () => {
    discovered = await discoverProviders(client());
    log(`Discovered providers: ${discovered.map(d => `${d.family}(${d.model}) [${d.models.length} models]`).join(', ')}`);
});

describe('protocol coverage', {timeout: 120_000}, () => {
    for (const [family, protocols] of familyProtocols) {
        describe(family, () => {
            const getProvider = () => discovered.find(d => d.family === family);

            for (const protocol of protocols.chat) {
                it(`${protocol} — non-streaming`, async () => {
                    const provider = getProvider();
                    if (!provider) return log(`  SKIPPED: ${family} not available`);

                    try {
                        const res = await client().chat.create({
                            model: provider.model,
                            messages: [{role: 'user', content: 'Say hello in one word.'}],
                            max_tokens: 1024,
                            protocol,
                        });

                        log(`[${protocol}] non-streaming:`, JSON.stringify(res, null, 2));
                        expect(res.output).toBeDefined();
                        expect(res.output.length).toBeGreaterThan(0);
                    } catch (e) {
                        handleError(protocol, e);
                    }
                });

                const streamLengths = [
                    {label: 'short', prompt: 'Say hi.', max_tokens: 512},
                    {label: 'medium', prompt: 'List 5 colors.', max_tokens: 1024},
                    {label: 'long', prompt: 'Write a paragraph about the ocean.', max_tokens: 2048},
                ];

                for (const {label, prompt, max_tokens} of streamLengths) {
                    it(`${protocol} — streaming (${label})`, async () => {
                        const provider = getProvider();
                        if (!provider) return log(`  SKIPPED: ${family} not available`);

                        try {
                            const stream = await client().chat.stream({
                                model: provider.model,
                                messages: [{role: 'user', content: prompt}],
                                max_tokens,
                                protocol,
                            });

                            let text = '';
                            let completed = false;
                            for await (const event of stream) {
                                if (event.type === 'response.output_text.delta' && event.delta) {
                                    text += event.delta;
                                }
                                if (event.type === 'response.completed') {
                                    completed = true;
                                }
                            }

                            log(`[${protocol}] streaming (${label}): "${text.slice(0, 80)}..." (${text.length} chars)`);
                            expect(completed).toBe(true);
                            expect(text.length).toBeGreaterThan(0);
                        } catch (e) {
                            handleError(protocol, e);
                        }
                    });
                }
            }

            for (const protocol of protocols.generate) {
                it(`${protocol} — non-streaming`, async () => {
                    const provider = getProvider();
                    if (!provider) return log(`  SKIPPED: ${family} not available`);

                    const genModel = provider.models.find(m => m.capabilities.includes('generate'));
                    const model = genModel?.id ?? provider.model;

                    try {
                        const res = await client().generate.create({
                            model,
                            prompt: 'Say hello in one word.',
                            max_tokens: 1024,
                            protocol,
                        });

                        log(`[${protocol}] generate (model=${model}):`, JSON.stringify(res, null, 2));
                        expect(res.output).toBeDefined();
                        expect(res.output.length).toBeGreaterThan(0);
                    } catch (e) {
                        handleError(protocol, e);
                    }
                });

                it(`${protocol} — streaming`, async () => {
                    const provider = getProvider();
                    if (!provider) return log(`  SKIPPED: ${family} not available`);

                    const genModel = provider.models.find(m => m.capabilities.includes('generate'));
                    const model = genModel?.id ?? provider.model;

                    try {
                        const stream = await client().generate.stream({
                            model,
                            prompt: 'Say hello in one word.',
                            max_tokens: 1024,
                            protocol,
                        });

                        let text = '';
                        let completed = false;
                        for await (const event of stream) {
                            if (event.type === 'response.output_text.delta' && event.delta) {
                                text += event.delta;
                            }
                            if (event.type === 'response.completed') {
                                completed = true;
                            }
                        }

                        log(`[${protocol}] generate streaming text: "${text}"`);
                        expect(completed).toBe(true);
                        expect(text.length).toBeGreaterThan(0);
                    } catch (e) {
                        handleError(protocol, e);
                    }
                });
            }

            for (const protocol of protocols.embed) {
                it(`${protocol}`, async () => {
                    const provider = getProvider();
                    if (!provider) return log(`  SKIPPED: ${family} not available`);

                    const embedModel = provider.models.find(m =>
                        m.capabilities.includes('embed') && /embed/i.test(m.id)
                    );
                    if (!embedModel) return log(`  SKIPPED: no embed model for ${family}`);

                    try {
                        const res = await client().embed.create({
                            model: embedModel.id,
                            input: 'Hello world',
                            protocol,
                            provider: family,
                        });

                        log(`[${protocol}] embed response (model=${embedModel.id}):`, JSON.stringify(res, null, 2).slice(0, 200));
                        expect(res.embeddings).toBeDefined();
                        expect(res.embeddings.length).toBeGreaterThan(0);
                        expect(res.embeddings[0].length).toBeGreaterThan(0);
                    } catch (e) {
                        handleError(protocol, e);
                    }
                });
            }

            for (const protocol of protocols.metrics) {
                it(`${protocol}`, async () => {
                    const provider = getProvider();
                    if (!provider) return log(`  SKIPPED: ${family} not available`);

                    const metricsModel = provider.models.find(m => m.capabilities.includes('metrics'));
                    const model = metricsModel?.id ?? provider.model;

                    try {
                        const res = await client().metrics.countTokens({
                            model,
                            messages: [{role: 'user', content: 'Hello world'}],
                            protocol,
                        });

                        log(`[${protocol}] count_tokens:`, JSON.stringify(res));
                        expect(res.input_tokens).toBeGreaterThan(0);
                    } catch (e) {
                        handleError(protocol, e);
                    }
                });
            }
        });
    }
});
