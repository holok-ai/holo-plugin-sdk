import type {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk, RequestType} from "../holo";
import type {HoloWorkerRequest, WorkerResponseEnvelope} from "../worker";
import type {ProviderRequest, ProviderResponse} from "../entities";
import {RouteDefinition} from "../routing";

export type ProviderEvent =
    | { type: "stream_event"; requestId: string; seq: number; event: any; ts: number }
    | { type: "text_delta"; requestId: string; seq: number; text: string; ts: number }
    | { type: "done"; requestId: string; seq: number; message: any; text: string; metrics?: any; ts: number }
    | {
    type: "error";
    requestId: string;
    seq: number;
    error: any;
    status?: number;
    headers?: Record<string, string>;
    metrics?: any;
    ts: number
};

export interface ProviderEnvelope {
    access_model: string;
    system_prompt?: string;
}

export interface ProviderContext {
    route: RouteDefinition;
    requestType?: RequestType;
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
    type: RequestType;
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
    done?: true;
}

export interface IWireAdapter {
    requestId: string;
    isStreaming: boolean;

    fromProviderEvent(ev: ProviderEvent): WireChunk[];
}

export interface WireAdapterParams {
    requestId: string;
    isStreaming: boolean;
    route: RouteDefinition;
    requestType: RequestType;
}

export interface IProvider {
    name: string;
    family: string;
    version: string;
    auditor: IAuditor;
    translator: IProviderTranslator;
    responseFactory: IResponseFactory;

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
