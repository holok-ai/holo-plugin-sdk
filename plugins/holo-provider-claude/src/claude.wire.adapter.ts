import {BaseWireAdapter} from "@holokai/sdk/provider";

export class ClaudeWireAdapter extends BaseWireAdapter {
    formatWire(data: any): string {
        const eventLine = `event: ${data.type}\n`
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;
        return eventLine + dataLine;
    }
}