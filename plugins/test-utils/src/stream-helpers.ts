import type {HoloStreamEvent} from '@holokai/types/holo';

export async function collectStreamText(stream: AsyncIterable<HoloStreamEvent>): Promise<string> {
    const parts: string[] = [];
    for await (const event of stream) {
        if (event.type === 'response.output_text.delta' && event.delta) {
            parts.push(event.delta);
        }
    }
    return parts.join('');
}

export async function collectStreamEvents(stream: AsyncIterable<HoloStreamEvent>): Promise<HoloStreamEvent[]> {
    const events: HoloStreamEvent[] = [];
    for await (const event of stream) {
        events.push(event);
    }
    return events;
}
