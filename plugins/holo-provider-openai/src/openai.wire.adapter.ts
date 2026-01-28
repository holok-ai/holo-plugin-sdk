import {BaseWireAdapter, ProviderEvent, WireChunk} from "@holokai/sdk";
import {ResponseStreamEvent} from "openai/resources/responses/responses";

export class OpenAICompletionsWireAdapter extends BaseWireAdapter {

    public formatWire(data: string | any): string {
        return `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
    }

    protected onDoneStreaming(ev: Extract<ProviderEvent, { type: "done" }>): WireChunk[] {
        return [this.chunkify('[DONE]', ev, true)];
    }
}


export class OpenAIResponsesWireAdapter extends BaseWireAdapter {
    formatWire(data: ResponseStreamEvent): string {
        const eventLine = `event: ${data.type}\n`
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;
        return eventLine + dataLine;
    }
}