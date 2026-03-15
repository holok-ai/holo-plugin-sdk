import type {IProviderPlugin} from '@holokai/types/plugin';
import type {ProviderEvent, WireChunk} from '@holokai/types/provider';
import type {FixtureScenario} from '../fixtures/types.js';
import {assertArrayEqual, assertEqual, type AssertionError} from '../dsl/assertions.js';

export interface TestResult {
    name: string;
    category: string;
    passed: boolean;
    errors: AssertionError[];
    duration: number;
}

export async function testWire(plugin: IProviderPlugin, fixture: FixtureScenario): Promise<TestResult> {
    const start = performance.now();
    const errors: AssertionError[] = [];

    const wire = await plugin.createWireAdapter({
        requestId: 'test-req',
        isStreaming: fixture.streaming,
        protocol: fixture.protocol
    });

    const allChunks: WireChunk[] = [];
    for (let i = 0; i < fixture.providerChunks.length; i++) {
        const isLast = i === fixture.providerChunks.length - 1;
        const event = toProviderEvent(fixture, i, isLast);
        const chunks = await wire.fromProviderEvent(event);
        allChunks.push(...chunks);
    }

    const firstChunk = allChunks[0];
    if (firstChunk) {
        const statusErr = assertEqual('status', firstChunk.status, fixture.expectedStatus);
        if (statusErr) errors.push(statusErr);

        if (fixture.expectedHeaders && firstChunk.headers) {
            for (const [k, v] of Object.entries(fixture.expectedHeaders)) {
                const headerErr = assertEqual(`headers.${k}`, firstChunk.headers[k], v);
                if (headerErr) errors.push(headerErr);
            }
        }
    } else {
        errors.push({field: 'wireChunks', expected: 'at least 1 chunk', actual: '0 chunks'});
    }

    const lastChunk = allChunks[allChunks.length - 1];
    if (lastChunk && !lastChunk.done) {
        errors.push({field: 'lastChunk.done', expected: true, actual: lastChunk.done});
    }

    const wireBodies = allChunks.map(c => c.body);
    const wireErrors = assertArrayEqual('wireBody', wireBodies, fixture.expectedWire);
    errors.push(...wireErrors);

    return {
        name: fixture.name,
        category: 'wire',
        passed: errors.length === 0,
        errors,
        duration: performance.now() - start,
    };
}

function toProviderEvent(fixture: FixtureScenario, index: number, isLast: boolean): ProviderEvent {
    const chunk = fixture.providerChunks[index];

    if (!fixture.streaming) {
        if (isLast) {
            return {
                type: 'done',
                requestId: 'test-req',
                seq: index,
                message: chunk,
                text: fixture.expectedText,
                ts: Date.now(),
            } as ProviderEvent;
        }
        return {
            type: 'stream_event',
            requestId: 'test-req',
            seq: index,
            event: chunk,
            ts: Date.now(),
        } as ProviderEvent;
    }

    if (isLast) {
        return {
            type: 'done',
            requestId: 'test-req',
            seq: index,
            message: chunk,
            text: fixture.expectedText,
            ts: Date.now(),
        } as ProviderEvent;
    }

    return {
        type: 'stream_event',
        requestId: 'test-req',
        seq: index,
        event: chunk,
        ts: Date.now(),
    } as ProviderEvent;
}
