import {BaseWireAdapter} from "@holokai/sdk";
import {Message} from "@anthropic-ai/sdk/resources/messages/messages";

export class ClaudeWireAdapter extends BaseWireAdapter {
    formatWire(data: Message): string {
        const eventLine = `event: ${data.type}\n`
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;
        return eventLine + dataLine;
    }
}