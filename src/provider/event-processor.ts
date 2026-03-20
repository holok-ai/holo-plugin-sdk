import {
    IWireAdapter,
    ProviderDoneEvent,
    ProviderErrorEvent,
    ProviderEvent,
    ProviderEventType
} from '@holokai/holo-types/provider';
import type {HoloWorkerRequest, WorkerResponseEnvelope} from '@holokai/holo-types/worker';

export interface ProviderEventResult {
    text: string | undefined;
    final?: HoloWorkerRequest;
}

export async function processProviderEvents(
    events: AsyncIterable<ProviderEvent>,
    wireAdapter: IWireAdapter,
    workerRequest: HoloWorkerRequest,
    envelope: WorkerResponseEnvelope,
    publisher: {
        publishChunk(sourceId: string, requestId: string, data: object): Promise<void>,
        publishFinal(final: HoloWorkerRequest & {
            providerEvent: ProviderDoneEvent | ProviderErrorEvent
        }): Promise<void>
    }
): Promise<ProviderEventResult> {
    const result: ProviderEventResult = {text: ''};
    for await (const evt of events) {
        if (evt.type === ProviderEventType.TEXT_DELTA) result.text += evt.text;
        for (const chunk of await wireAdapter.fromProviderEvent(evt)) {
            await publisher.publishChunk(envelope.source_id, envelope.request_id, chunk);
        }
        if (evt.type === ProviderEventType.DONE || evt.type === ProviderEventType.ERROR) {
            result.text = evt.type === ProviderEventType.DONE ? evt.text : evt.acc;
            const final = {...workerRequest, providerEvent: evt};
            if (envelope.worker_id) final.workerId = envelope.worker_id;
            result.final = final;
            await publisher.publishFinal(final);
            break;
        }
    }
    return result;
}
