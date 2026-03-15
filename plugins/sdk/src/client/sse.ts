import type {HoloStreamEvent} from '@holokai/types/holo';

export async function* parseSSEStream(
    body: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
): AsyncGenerator<HoloStreamEvent> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            if (signal?.aborted) break;

            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});

            const events = extractEvents(buffer);
            buffer = events.remaining;

            for (const event of events.parsed) {
                yield event;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

interface ParsedEvents {
    parsed: HoloStreamEvent[];
    remaining: string;
}

function extractEvents(buffer: string): ParsedEvents {
    const parsed: HoloStreamEvent[] = [];
    let remaining = buffer;

    while (true) {
        const doubleNewline = remaining.indexOf('\n\n');
        if (doubleNewline === -1) break;

        const block = remaining.slice(0, doubleNewline);
        remaining = remaining.slice(doubleNewline + 2);

        const event = parseSSEBlock(block);
        if (event) {
            parsed.push(event);
        }
    }

    return {parsed, remaining};
}

function parseSSEBlock(block: string): HoloStreamEvent | null {
    let data = '';

    for (const line of block.split('\n')) {
        if (line.startsWith('data: ')) {
            data += line.slice(6);
        } else if (line.startsWith('data:')) {
            data += line.slice(5);
        }
    }

    if (!data) return null;

    try {
        return JSON.parse(data) as HoloStreamEvent;
    } catch {
        return null;
    }
}
