import {BaseProvider, IProvider, ModelInfo, ProviderContext} from "@holokai/sdk";
import {Anthropic} from "@anthropic-ai/sdk/client";
import {MessageCreateParamsBase} from "@anthropic-ai/sdk/resources/messages";


export class ClaudeProvider extends BaseProvider implements IProvider {

    protected readonly client: Anthropic;

    constructor(
        public readonly name: string,
        public readonly family: string,
        public readonly version: string,
        protected readonly _config: any) {
        super(name, family, version, _config);
        this.client = new Anthropic(this._config);
    }

    async getModels(): Promise<ModelInfo[]> {
        try {
            const logger = this.mlog(this.getModels);
            const response = await this.client!.models.list();
            logger.debug(`Claude models: ${JSON.stringify(response.data)}`);
            const modelList = response.data.map(model => ({
                id: model.id,
                name: model.display_name,
                modified_at: model.created_at
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            return modelList;
        } catch (error) {
            throw error;
        }
    }


    protected async handleRequest(payload: MessageCreateParamsBase, ctx: ProviderContext) {
        if (payload.stream) {
            const s = this.client.messages.stream(payload);
            s.on("streamEvent", (event: any) => ctx.emitStreamEvent(event));
            s.on("text", (delta: string) => ctx.emitTextDelta(delta));
            return {final: () => s.finalMessage()};
        }

        // Non-streaming
        const req = {...payload, stream: false};
        return {final: () => this.client.messages.create(req)};
    }
}