import type {IAuditor, IWireAdapter, ProviderEvent} from '@holokai/types/provider';
import type {WorkerResponseEnvelope} from '@holokai/types/worker';
import type {PipelineResult} from './types.js';

export async function runRequestPipeline(
    events: AsyncIterable<ProviderEvent>,
    wireAdapter: IWireAdapter,
    auditor: IAuditor,
    envelope: WorkerResponseEnvelope
): Promise<PipelineResult> {
    const result: PipelineResult = {wireChunks: [], auditRecord: null, events: [], text: ''};

    for await (const evt of events) {
        result.events.push(evt);
        for (const chunk of await wireAdapter.fromProviderEvent(evt)) {
            result.wireChunks.push(chunk);
        }
        if (evt.type === 'done' || evt.type === 'error') {
            if (evt.type === 'done') result.text = evt.text;
            result.auditRecord = await auditor.auditResponse(envelope, evt);
            break;
        }
    }

    return result;
}

export async function runPipelineFromFixture(
    providerEvents: ProviderEvent[],
    wireAdapter: IWireAdapter,
    auditor: IAuditor,
    envelope: WorkerResponseEnvelope
): Promise<PipelineResult> {
    return runRequestPipeline(
        asyncIterableFrom(providerEvents),
        wireAdapter,
        auditor,
        envelope
    );
}

async function* asyncIterableFrom<T>(items: T[]): AsyncIterable<T> {
    for (const item of items) {
        yield item;
    }
}
