import type {IProviderPlugin} from '@holokai/types/plugin';
import type {ProviderEvent} from '@holokai/types/provider';
import type {HoloWorkerRequest, WorkerResponseEnvelope} from '@holokai/types/worker';
import {runPipelineFromFixture} from '@holokai/lib';
import type {FixtureScenario} from '../fixtures/types.js';
import {assertEqual, type AssertionError} from '../dsl/assertions.js';
import type {TestResult} from './wire-tester.js';
import {NotificationEvent} from "@holokai/types";

export async function testPipeline(plugin: IProviderPlugin, fixture: FixtureScenario): Promise<TestResult> {
    const start = performance.now();
    const errors: AssertionError[] = [];

    const wire = await plugin.createWireAdapter({
        requestId: 'test-req',
        isStreaming: fixture.streaming,
        protocol: fixture.protocol,
    });

    const envelope: WorkerResponseEnvelope = {
        source_id: 'test-source-id',
        request_id: 'test-req',
        organization_id: 'test-org',
        provider: {id: 'test-provider-id', name: 'test'} as any,
        protocol: {id: 'test-protocol-id', name: fixture.protocol, capability: 'chat'} as any,
        access_model: fixture.expectedAudit?.access_model ?? 'unknown',
    };

    const workerRequest: HoloWorkerRequest = {
        organizationId: 'test-org',
        provider: envelope.provider,
        protocol: envelope.protocol,
        sourceId: 'test-source-id',
        requestId: 'test-req',
        payload: {},
        timestamp: new Date().toISOString(),
        isStreaming: fixture.streaming,
        httpRequestDetails: {path: '/test', method: 'POST'},
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

    let auditedRecord: HoloWorkerRequest | null = null;
    const publisher = {
        sendResponseChunk: (_s: string, _r: string, _d: any) => Promise.resolve(),
        sendToAudit: async (data: HoloWorkerRequest) => {
            auditedRecord = data;
        }
    };

    const notifier = {
        publish: (_event: NotificationEvent) => Promise.resolve()
    }

    const result = await runPipelineFromFixture(providerEvents, wire, workerRequest, envelope, publisher, notifier);

    const textErr = assertEqual('text', result.text, fixture.expectedText);
    if (textErr) errors.push(textErr);

    if (fixture.expectedAudit && auditedRecord) {
        const hasEvent = assertEqual('audit.hasProviderEvent', !!(auditedRecord as HoloWorkerRequest).providerEvent, true);
        if (hasEvent) errors.push(hasEvent);
    }

    return {
        name: fixture.name,
        category: 'pipeline',
        passed: errors.length === 0,
        errors,
        duration: performance.now() - start,
    };
}
