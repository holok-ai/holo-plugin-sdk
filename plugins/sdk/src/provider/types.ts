import {RequestType} from "../holo";
import {HoloWorkerRequest, WorkerResponseEnvelope} from "../core/worker";
import {IAuditor} from "./auditor";
import {IProviderTranslator} from "./translator";
import {LlmRequest, LlmResponse} from "../core/entities";
import {AsyncEventQueue} from "../core";

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

export type ProviderEnvelope = {
    model_slug: string;
    system_prompt?: string;
}

export type ProviderContext = {
    requestType?: RequestType;
    headers?: Record<string, string | string[]>;
    query?: Record<string, string>;
    // stream: boolean;
    // signal?: AbortSignal;

    // Provider uses these; BaseProvider supplies them
    emitStreamEvent: (event: any) => void;
    emitTextDelta: (text: string) => void;
};

export type RunHandle<Final> = {
    final: () => Promise<Final>;
    cancel?: () => void;
};

export interface ProviderCapabilities {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    functionCalling: boolean;
    maxTokens: number;
}


/**
 * Model information interface
 */
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

    [key: string]: any; // Allow additional properties
}


export interface AIRequestStat {
    type: RequestType;
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}


export interface IProvider {
    name: string;
    family: string;
    version: string;
    auditor: IAuditor;
    translator: IProviderTranslator
    responseFactory: IResponseFactory

    getModels(allowedModels: string[] | true): Promise<any>;

    getModelNameFromRequest(payload: any): Promise<string>;

    processWorkerRequest(
        request: HoloWorkerRequest,
        opts?: { signal?: AbortSignal }
    ): Promise<AsyncEventQueue<ProviderEvent>>;

    auditRequest(workerRequest: HoloWorkerRequest): Promise<LlmRequest>;

    auditResponse(
        workerEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent
    ): Promise<LlmResponse>;
}

export interface IResponseFactory {
    createError(message: string, code?: string): any;
}