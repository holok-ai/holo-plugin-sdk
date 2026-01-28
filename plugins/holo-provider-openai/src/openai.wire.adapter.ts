import {BaseWireAdapter, ProviderEvent, WireChunk} from "@holokai/sdk";

export class OpenAIWireAdapter extends BaseWireAdapter {

    public formatWire(data: string | any): string {
        return `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
    }

    protected onDoneStreaming(ev: Extract<ProviderEvent, { type: "done" }>): WireChunk[] {
        return [this.chunkify('[DONE]', ev, true)];
    }
}