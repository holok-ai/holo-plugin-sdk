export interface SseFrame {
    event?: string | undefined;
    data: string;
}

export function parseSseBody(body: string): SseFrame[] {
    const frames: SseFrame[] = [];
    const blocks = body.split('\n\n').filter(b => b.trim());

    for (const block of blocks) {
        const lines = block.split('\n');
        let event: string | undefined;
        let data = '';

        for (const line of lines) {
            if (line.startsWith('event: ')) {
                event = line.slice(7);
            } else if (line.startsWith('data: ')) {
                data = line.slice(6);
            }
        }

        if (data) {
            frames.push({event, data});
        }
    }

    return frames;
}
