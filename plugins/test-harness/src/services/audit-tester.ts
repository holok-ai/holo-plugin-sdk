import type {IProviderPlugin} from '@holokai/types/plugin';
import type {IAuditor, ProviderEvent} from '@holokai/types/provider';
import type {WorkerResponseEnvelope} from '@holokai/types/worker';
import type {FixtureScenario} from '../fixtures/types.js';
import {assertEqual, assertPartialMatch, type AssertionError} from '../dsl/assertions.js';
import type {TestResult} from './wire-tester.js';

export async function testAudit(plugin: IProviderPlugin, fixture: FixtureScenario): Promise<TestResult> {
    const start = performance.now();
    const errors: AssertionError[] = [];

    if (!fixture.expectedAudit) {
        return {
            name: fixture.name,
            category: 'audit',
            passed: true,
            errors: [],
            duration: performance.now() - start,
        };
    }

    const auditor = await resolveAuditor(plugin);

    const lastChunk = fixture.providerChunks[fixture.providerChunks.length - 1];
    const doneEvent: ProviderEvent = {
        type: 'done',
        requestId: 'test-req',
        seq: fixture.providerChunks.length - 1,
        message: lastChunk,
        text: fixture.expectedText,
        ts: Date.now(),
    } as ProviderEvent;

    const envelope: WorkerResponseEnvelope = {
        request_id: 'test-req',
        organization_id: 'test-org',
        provider: {id: 'test-provider-id', name: 'test'} as any,
        protocol: {id: 'test-protocol-id', name: fixture.protocol, capability: 'chat'} as any,
        access_model: fixture.expectedAudit.access_model,
    };

    const responseRecord = await auditor.auditResponse(envelope, doneEvent);

    const modelErr = assertEqual('access_model', responseRecord.access_model, fixture.expectedAudit.access_model);
    if (modelErr) errors.push(modelErr);

    if (fixture.expectedAudit.input_tokens !== undefined) {
        const err = assertEqual('input_tokens', responseRecord.input_tokens, fixture.expectedAudit.input_tokens);
        if (err) errors.push(err);
    }

    if (fixture.expectedAudit.output_tokens !== undefined) {
        const err = assertEqual('output_tokens', responseRecord.output_tokens, fixture.expectedAudit.output_tokens);
        if (err) errors.push(err);
    }

    const statusErr = assertEqual('status', responseRecord.status, fixture.expectedAudit.status);
    if (statusErr) errors.push(statusErr);

    if (fixture.expectedAudit.metadata) {
        const metaErr = assertPartialMatch('metadata', responseRecord.metadata, fixture.expectedAudit.metadata);
        if (metaErr) errors.push(metaErr);
    }

    return {
        name: fixture.name,
        category: 'audit',
        passed: errors.length === 0,
        errors,
        duration: performance.now() - start,
    };
}

async function resolveAuditor(plugin: IProviderPlugin): Promise<IAuditor> {
    try {
        const provider = await plugin.createProvider('test-id', 'test', {apiKey: 'test-key'});
        return provider.auditor;
    } catch {
        const mod = await import(pluginAuditorPath(plugin.family));
        const AuditorClass = Object.values(mod).find(
            (v: any) => typeof v === 'function' && v.prototype?.auditResponse
        ) as any;
        if (AuditorClass) return new AuditorClass();
        throw new Error(`Cannot resolve auditor for plugin ${plugin.family}`);
    }
}

function pluginAuditorPath(family: string): string {
    const map: Record<string, string> = {
        openai: '@holokai/holo-provider-openai',
        claude: '@holokai/holo-provider-claude',
        gemini: '@holokai/holo-provider-gemini',
        ollama: '@holokai/holo-provider-ollama',
    };
    return map[family] ?? `@holokai/holo-provider-${family}`;
}
