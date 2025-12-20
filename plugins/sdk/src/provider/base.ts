import {AIRequestStat, IProvider, ModelInfo, ProviderConfig} from "./types";
import {HoloWorkerRequest} from "../core/worker";
import {ObservableClassLogger} from "@holokai/sdk/core";
import {RequestType} from "@holokai/sdk/holo";


export abstract class BaseProvider extends ObservableClassLogger implements IProvider {
    protected models: Record<string, ModelInfo> = {};

    constructor(
        protected readonly _config: ProviderConfig,
    ) {
        super();

        this.init().then(() => this.log.info(`Provider [${this.name}] initialized.`));
    }

    abstract init(): Promise<void>;

    abstract getModels(): Promise<ModelInfo[]>;

    async processWorkerRequest(request: HoloWorkerRequest): Promise<AIRequestStat> {
        const {type, payload} = request;
        return await this.wrapWithStats(
            type,
            this.handleRequest.bind(this),
            type,
            payload
        );
    }

    abstract handleRequest(request: any, type: RequestType): Promise<void>;

    get id(): string {
        return this._config.id;
    }

    get name(): string {
        return this._config.name;
    }

    protected audit(response: any, _acc: any = null) {
        this.emit('audit', response);
    }

    protected data(response: any, _acc: any = null) {
        this.emit('data', response);
    }

    protected error(response: any) {
        this.emit('error', response);
    }

    protected done(response: any, _acc: any = null) {
        this.emit('done', response);
    }

    /**
     * Wraps provider method calls with statistics tracking, error handling, and logging.
     * Automatically measures execution time and tracks success/error counts.
     *
     * @param type - The type of request being processed (GENERATE or CHAT)
     * @param method - The provider method to execute (must be bound to provider instance)
     * @param args - Arguments to pass to the method, first two must be sourceId and requestId
     * @returns Promise resolving to AIRequestStat with timing and success/error metrics
     */
    protected async wrapWithStats<T extends [sourceId: string, requestId: string, ...any[]]>(
        type: RequestType,
        method: (...args: T) => Promise<void>,
        ...args: T
    ): Promise<AIRequestStat> {
        const logger = this.mlog(this.wrapWithStats);
        const startTime = Date.now();
        let success = 0;
        let error = 0;

        // Extract sourceId and requestId from the first two arguments
        const [sourceId, requestId] = args as [string, string, ...any[]];

        logger.debug(`[${sourceId}-${requestId}] ${type.charAt(0).toUpperCase() + type.slice(1)} request: ${requestId}`);
        try {
            await method(...args);
            success++;
        } catch (e) {
            logger.error(`[${sourceId}-${requestId}] ${type.charAt(0).toUpperCase() + type.slice(1)} error: ${(e as Error).message}`);
            // await this.onError(sourceId, requestId, e as Error);
            error++;
        }
        const endTime = Date.now();
        return {
            type,
            startTime,
            endTime,
            duration: endTime - startTime,
            success,
            error
        };
    }
}