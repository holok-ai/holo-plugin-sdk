import {describe, it, expect} from 'vitest';
import {parseSSEStream} from '../../src/client/sse.js';
import type {HoloStreamEvent} from '@holokai/types/holo';

function toStream(text: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(text));
            controller.close();
        },
    });
}

function toChunkedStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
        },
    });
}

async function collect(stream: AsyncGenerator<HoloStreamEvent>): Promise<HoloStreamEvent[]> {
    const events: HoloStreamEvent[] = [];
    for await (const event of stream) {
        events.push(event);
    }
    return events;
}

describe('parseSSEStream', () => {
    it('parses a single event', async () => {
        const body = toStream('data: {"type":"response.created","response":{"id":"r1","model":"gpt-4o"}}\n\n');
        const events = await collect(parseSSEStream(body));
        expect(events).toHaveLength(1);
        expect(events[0]!.type).toBe('response.created');
    });

    it('parses multiple events', async () => {
        const text = [
            'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n',
            'data: {"type":"response.output_text.delta","delta":" world"}\n\n',
            'data: {"type":"response.completed","finish_reason":"stop"}\n\n',
        ].join('');
        const events = await collect(parseSSEStream(toStream(text)));
        expect(events).toHaveLength(3);
        expect(events[0]!.delta).toBe('Hello');
        expect(events[1]!.delta).toBe(' world');
        expect(events[2]!.type).toBe('response.completed');
    });

    it('handles multi-line data fields', async () => {
        const text = 'data: {"type":"response.output_text.delta",\ndata: "delta":"hi"}\n\n';
        const events = await collect(parseSSEStream(toStream(text)));
        expect(events).toHaveLength(1);
        expect(events[0]!.delta).toBe('hi');
    });

    it('ignores malformed blocks', async () => {
        const text = [
            'data: not-json\n\n',
            'data: {"type":"response.output_text.delta","delta":"ok"}\n\n',
        ].join('');
        const events = await collect(parseSSEStream(toStream(text)));
        expect(events).toHaveLength(1);
        expect(events[0]!.delta).toBe('ok');
    });

    it('handles partial buffer across chunks', async () => {
        const body = toChunkedStream([
            'data: {"type":"response.output_text',
            '.delta","delta":"split"}\n\n',
        ]);
        const events = await collect(parseSSEStream(body));
        expect(events).toHaveLength(1);
        expect(events[0]!.delta).toBe('split');
    });

    it('handles data: without space', async () => {
        const body = toStream('data:{"type":"response.output_text.delta","delta":"no-space"}\n\n');
        const events = await collect(parseSSEStream(body));
        expect(events).toHaveLength(1);
        expect(events[0]!.delta).toBe('no-space');
    });

    it('skips blocks with no data lines', async () => {
        const text = ':comment\n\ndata: {"type":"response.output_text.delta","delta":"after-comment"}\n\n';
        const events = await collect(parseSSEStream(toStream(text)));
        expect(events).toHaveLength(1);
    });

    it('respects abort signal', async () => {
        const controller = new AbortController();
        controller.abort();
        const body = toStream('data: {"type":"response.output_text.delta","delta":"never"}\n\n');
        const events = await collect(parseSSEStream(body, controller.signal));
        expect(events).toHaveLength(0);
    });
});
