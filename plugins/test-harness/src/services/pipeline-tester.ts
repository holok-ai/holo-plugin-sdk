import type {IProviderPlugin} from '@holokai/types/plugin';
import type {ProviderEvent} from '@holokai/types/provider';
import type {WorkerResponseEnvelope} from '@holokai/types/worker';
import {runPipelineFromFixture} from '@holokai/lib';
import type {FixtureScenario} from '../fixtures/types.js';
import {assertArrayEqual, assertEqual, type AssertionError} from '../dsl/assertions.js';
import type {TestResult} from './wire-tester.js';

export async function testPipeline(plugin: IProviderPlugin, fixture: FixtureScenario): Promise<TestResult> {
    const start = performance.now();
    const errors: AssertionError[] = [];

    const wire = await plugin.createWireAdapter({
        requestId: 'test-req',
        isStreaming: fixture.streaming,
        protocol: fixture.protocol,
    });

    let auditor;
    try {
        const provider = await plugin.createProvider('test-id', 'test', {apiKey: 'test-key'});
        auditor = provider.auditor;
    } catch {
        const mod = await import(`@holokai/holo-provider-${plugin.family}`);
        const AuditorClass = Object.values(mod).find(
            (v: any) => typeof v === 'function' && v.prototype?.auditResponse
        ) as any;
        if (!AuditorClass) throw new Error(`Cannot resolve auditor for ${plugin.family}`);
        auditor = new AuditorClass();
    }

    const envelope: WorkerResponseEnvelope = {
        request_id: 'test-req',
        organization_id: 'test-org',
        provider: {id: 'test-provider-id', name: 'test'} as any,
        protocol: {id: 'test-protocol-id', name: fixture.protocol, capability: 'chat'} as any,
        access_model: fixture.expectedAudit?.access_model ?? 'unknown',
    };

    const providerEvents: ProviderEvent[] = fixture.providerChunks.map((chunk, i) => {
        const isLast = i === fixture.providerChunks.length - 1;
        if (isLast) {
            return {
                type: 'done',
                requestId: 'test-req',
                seq: i,
                message: chunk,
                text: fixture.expectedText,
                ts: Date.now(),
            } as ProviderEvent;
        }
        return {
            type: 'stream_event',
            requestId: 'test-req',
            seq: i,
            event: chunk,
            ts: Date.now(),
        } as ProviderEvent;
    });

    const result = await runPipelineFromFixture(providerEvents, wire, auditor, envelope);

    const textErr = assertEqual('text', result.text, fixture.expectedText);
    if (textErr) errors.push(textErr);

    const wireBodies = result.wireChunks.map(c => c.body);
    const wireErrors = assertArrayEqual('wireBody', wireBodies, fixture.expectedWire);
    errors.push(...wireErrors);

    if (result.auditRecord && fixture.expectedAudit) {
        const statusErr = assertEqual('audit.status', result.auditRecord.status, fixture.expectedAudit.status);
        if (statusErr) errors.push(statusErr);
    }

    return {
        name: fixture.name,
        category: 'pipeline',
        passed: errors.length === 0,
        errors,
        duration: performance.now() - start,
    };
}
