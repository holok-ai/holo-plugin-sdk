import type {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "../holo";
import type {HoloWorkerRequest, WorkerResponseEnvelope} from "../worker";
import type {Protocol, ProtocolCapability, ProviderRequest, ProviderResponse} from "../entities";
import {IProviderPlugin} from "../plugin";

export type ProviderEvent =
    | { type: "stream_event"; requestId: string; seq: number; event: any; ts: number; }
    | { type: "text_delta"; requestId: string; seq: number; text: string; ts: number; }
    | {
    type: "done";
    requestId: string;
    seq: number;
    message: any;
    text: string;
    metrics?: any;
    ts: number;
}
    | {
    type: "error";
    requestId: string;
    seq: number;
    error: any;
    status?: number;
    headers?: Record<string, string>;
    metrics?: any;
    ts: number;
};

export interface ProviderEnvelope {
    access_model: string;
    system_prompt?: string;
}

export interface ProviderContext {
    protocol: Protocol;
    headers?: Record<string, string | string[]>;
    query?: Record<string, string>;
    emitStreamEvent: (event: any) => void;
    emitTextDelta: (text: string) => void;
}

export interface RunHandle<Final> {
    final: () => Promise<Final>;
    cancel?: () => void;
}

export interface ProviderCapabilities {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    functionCalling: boolean;
    maxTokens: number;
}

export interface ModelInfo {
    id: string;
    name?: string;
    description?: string;
    size?: number;
    parameterCount?: string;
    quantization?: string;
    family?: string;
    parentModel?: string;
    format?: string;

    [key: string]: any;
}

export interface AIRequestStat {
    type: ProtocolCapability;
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}

export interface IResponseFactory {
    createError(message: string, code?: string): any;
}

export interface IAuditor {
    readonly provider: string;

    auditRequest(workerRequest: HoloWorkerRequest): Promise<ProviderRequest>;

    createWorkerResponseEnvelope(workerRequest: HoloWorkerRequest, workerId?: string): Promise<WorkerResponseEnvelope>;

    auditResponse(
        responseEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent,
    ): Promise<ProviderResponse>;
}

export interface IProviderTranslator {
    toHoloRequest(request: any): Promise<Partial<HoloRequest>>;

    fromHoloRequest(request: HoloRequest): Promise<Partial<any>>;

    toHoloMessages(messages: any[]): Promise<Partial<HoloMessage>[]>;

    fromHoloMessages(messages: HoloMessage[]): Promise<Partial<any>[]>;

    toHoloResponse(response: any): Promise<Partial<HoloResponse>>;

    fromHoloResponse(response: HoloResponse): Promise<Partial<any>>;

    fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown>;
}

export interface TranslateOptions {
    fromHolo?: boolean;
    validateTarget?: boolean;
    failQuietly?: boolean;
}

export interface WireChunk {
    requestId: string;
    seq: number;
    eventSeq?: number;
    headers?: Record<string, string>;
    status?: number;
    body: string;
    fullText?: string;
    done?: true;
}

export interface IWireAdapter {
    requestId: string;
    isStreaming: boolean;

    fromProviderEvent(ev: ProviderEvent): Promise<WireChunk[]>;
}

export interface WireAdapterParams {
    requestId: string;
    isStreaming: boolean;
    protocol: string;
}

export interface IProvider {
    id: string;
    name: string;
    auditor: IAuditor;
    translator: IProviderTranslator;
    responseFactory: IResponseFactory;
    plugin: IProviderPlugin;

    getModels(allowedModels: string[] | true): Promise<any>;

    getModelNameFromRequest(payload: any): Promise<string | undefined>;

    processWorkerRequest(
        request: HoloWorkerRequest,
        opts?: { signal?: AbortSignal }
    ): Promise<AsyncIterable<ProviderEvent>>;

    auditRequest(workerRequest: HoloWorkerRequest): Promise<ProviderRequest>;

    auditResponse(
        workerEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent
    ): Promise<ProviderResponse>;
}

export interface ProviderRunner<Final = any> {
    final: () => Promise<Final>;
    cancel?: () => void;
}
