import {IAuditor, IWireAdapter, ProviderEvent, ProviderEventType} from '@holokai/types/provider';
import type {WorkerResponseEnvelope} from '@holokai/types/worker';
import {NotificationEvent, ProviderResponse} from "@holokai/types";
import {NotificationEventFactory} from "@holokai/sdk/notification";
import {PipelineResult} from "./types";

export async function runRequestPipeline(
    events: AsyncIterable<ProviderEvent>,
    wireAdapter: IWireAdapter,
    auditor: IAuditor,
    envelope: WorkerResponseEnvelope,
    publisher: {
        sendResponseChunk(sourceId: string, requestId: string, data: object): Promise<void>,
        sendToAudit(requestId: string, data: ProviderResponse): Promise<void>
    },
    notifier: {
        publish(event: NotificationEvent): Promise<void>
    },
): Promise<PipelineResult> {
    const result: PipelineResult = {wireChunks: [], auditRecord: null, events: [], text: ''};
    for await (const evt of events) {
        if (evt.type === ProviderEventType.TEXT_DELTA) result.text += evt.text;
        for (const chunk of await wireAdapter.fromProviderEvent(evt)) {
            await publisher.sendResponseChunk(envelope.source_id, envelope.request_id, chunk);
        }
        if (evt.type === ProviderEventType.DONE || evt.type === ProviderEventType.ERROR) {
            result.text = evt.type === ProviderEventType.DONE ? evt.text : evt.acc;
            const auditRecord = await auditor.auditResponse(envelope, evt);
            await publisher.sendToAudit(envelope.request_id, auditRecord);
            await notifier.publish(NotificationEventFactory.fromProviderEvent(envelope, evt));
            break;
        }
    }
    return result;
}

export async function runPipelineFromFixture(
    providerEvents: ProviderEvent[],
    wireAdapter: IWireAdapter,
    auditor: IAuditor,
    envelope: WorkerResponseEnvelope,
    publisher: {
        sendResponseChunk(sourceId: string, requestId: string, data: object): Promise<void>,
        sendToAudit(requestId: string, data: ProviderResponse): Promise<void>
    },
    notifier: {
        publish(event: NotificationEvent): Promise<void>
    },
): Promise<PipelineResult> {
    return runRequestPipeline(
        asyncIterableFrom(providerEvents),
        wireAdapter,
        auditor,
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
