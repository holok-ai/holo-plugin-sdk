import {IWireAdapter, ProviderEvent, ProviderEventType} from '@holokai/types/provider';
import type {HoloWorkerRequest, WorkerResponseEnvelope} from '@holokai/types/worker';
import {NotificationEvent} from "@holokai/types";
import {NotificationEventFactory} from "@holokai/sdk/notification";
import {PipelineResult} from "./types";

export async function runRequestPipeline(
    events: AsyncIterable<ProviderEvent>,
    wireAdapter: IWireAdapter,
    workerRequest: HoloWorkerRequest,
    envelope: WorkerResponseEnvelope,
    publisher: {
        sendResponseChunk(sourceId: string, requestId: string, data: object): Promise<void>,
        sendToAudit(data: HoloWorkerRequest): Promise<void>
    },
    notifier: {
        publish(event: NotificationEvent): Promise<void>
    },
): Promise<PipelineResult> {
    const result: PipelineResult = {text: ''};
    for await (const evt of events) {
        if (evt.type === ProviderEventType.TEXT_DELTA) result.text += evt.text;
        for (const chunk of await wireAdapter.fromProviderEvent(evt)) {
            await publisher.sendResponseChunk(envelope.source_id, envelope.request_id, chunk);
        }
        if (evt.type === ProviderEventType.DONE || evt.type === ProviderEventType.ERROR) {
            result.text = evt.type === ProviderEventType.DONE ? evt.text : evt.acc;
            const auditRecord: HoloWorkerRequest = {...workerRequest, providerEvent: evt};
            if (envelope.worker_id) auditRecord.workerId = envelope.worker_id;
            await publisher.sendToAudit(auditRecord);
            await notifier.publish(NotificationEventFactory.fromProviderEvent(envelope, evt));
            break;
        }
    }
    return result;
}

export async function runPipelineFromFixture(
    providerEvents: ProviderEvent[],
    wireAdapter: IWireAdapter,
    workerRequest: HoloWorkerRequest,
    envelope: WorkerResponseEnvelope,
    publisher: {
        sendResponseChunk(sourceId: string, requestId: string, data: object): Promise<void>,
        sendToAudit(data: HoloWorkerRequest): Promise<void>
    },
    notifier: {
        publish(event: NotificationEvent): Promise<void>
    },
): Promise<PipelineResult> {
    return runRequestPipeline(
        asyncIterableFrom(providerEvents),
        wireAdapter,
        workerRequest,
        envelope,
        publisher,
        notifier
    );
}

async function* asyncIterableFrom<T>(items: T[]): AsyncIterable<T> {
    for (const item of items) {
        yield item;
    }
}
