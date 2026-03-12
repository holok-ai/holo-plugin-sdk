import {BaseWireAdapter} from "@holokai/sdk/provider";
import type {WireChunk} from "@holokai/types/provider";
import {ProviderEvent} from "@holokai/types/provider";
import {ResponseStreamEvent} from "openai/resources/responses/responses";

export class OpenAICompletionsWireAdapter extends BaseWireAdapter {

    public formatWire(data: string | any): string {
        return `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
    }

    protected async onDoneStreaming(ev: Extract<ProviderEvent, { type: "done" }>): Promise<WireChunk[]> {
        return [
            await this.chunkify(ev, async (_ev) => this.formatWire(ev.message)),
            await this.chunkify(ev, async (_ev) => this.formatWire('[DONE]'), true, {fullText: ev.text})
        ];
    }
}


export class OpenAIResponsesWireAdapter extends BaseWireAdapter {
    formatWire(data: ResponseStreamEvent): string {
        const eventLine = `event: ${data.type}\n`
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;
        return eventLine + dataLine;
    }
}