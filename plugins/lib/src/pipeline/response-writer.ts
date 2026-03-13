import type {Response} from 'express';
import type {WireChunk} from '@holokai/types/provider';

export async function writeWireToResponse(
    chunks: AsyncIterable<WireChunk>,
    res: Response
): Promise<void> {
    let headersSent = false;
    for await (const wire of chunks) {
        if (wire.headers && !headersSent) {
            if (wire.status) res.status(wire.status);
            Object.entries(wire.headers).forEach(([k, v]) => res.setHeader(k, v));
            headersSent = true;
        }

        if (wire.body) {
            if (!res.write(wire.body)) {
                await new Promise<void>(resolve => res.once('drain', resolve));
            }
        }

        if (wire.done) {
            res.end();
        }
    }
}
