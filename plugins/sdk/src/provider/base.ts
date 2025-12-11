import {ModelInfo, ProviderConfig} from "./types";
import {PluginContext} from "../plugin/context";
import {HoloWorkerRequest} from "../core/worker";
import {ObservableClassLogger} from "@holokai/sdk/core";


export abstract class BaseProvider extends ObservableClassLogger {
    protected models: Record<string, ModelInfo> = {};

    protected constructor(
        private readonly _context: PluginContext,
        protected readonly _config: ProviderConfig,
    ) {
        super();
    }

    abstract init(): Promise<void>;

    abstract getModels(): Promise<ModelInfo[]>;

    async processWorkerRequest(request: HoloWorkerRequest) {

    }
}