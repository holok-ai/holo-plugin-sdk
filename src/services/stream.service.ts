import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {Response} from "express";
import {ResponseStream} from "./response.service";
import {ClassLogger, WireChunk} from "@holokai/sdk";

type StreamEntry = {
    stream: ResponseStream;
    res: Response | null;

    headersSet: boolean;
    pendingHeaders: Record<string, string> | null;

    pendingBodies: string[];
    pendingDone: boolean;

    closed: boolean;
};

@injectable()
export class StreamService extends ClassLogger {
    private readonly streams = new Map<string, StreamEntry>();

    getStream(requestId: string): ResponseStream | undefined {
        return this.streams.get(requestId)?.stream;
    }

    async ensureStream(requestId: string, isStreaming: boolean = true): Promise<ResponseStream> {
        const logger = this.mlog(this.ensureStream);

        const existing = this.streams.get(requestId);
        if (existing) return existing.stream;

        const stream = new ResponseStream(requestId, isStreaming);

        const entry: StreamEntry = {
            stream,
            res: null,

            headersSet: false,
            pendingHeaders: null,

            pendingBodies: [],
            pendingDone: false,

            closed: false,
        };

        this.streams.set(requestId, entry);

        stream.on('end', () => {
            logger.debug(`Stream ended for request ${requestId}`);
            this.removeStream(requestId);
        });

        stream.on('error', (err) => {
            logger.error(`Stream error for request ${requestId}: ${(err as any)?.message ?? String(err)}`);
            this.removeStream(requestId);
        });

        return stream;
    }

    attachResponse(requestId: string, res: Response): void {
        const logger = this.mlog(this.attachResponse);
        const entry = this.streams.get(requestId);
        if (!entry) return;

        if (!entry.res) entry.res = res;

        if (!entry.headersSet && entry.pendingHeaders) {
            this.applyHeadersOnce(requestId, entry, entry.pendingHeaders);
            entry.pendingHeaders = null;
        }

        // If headers are already set (or just set), flush any buffered bodies.
        this.flushPending(entry);
        logger.debug(`Attached HTTP response for request ${requestId}`);
    }

    writeWire(requestId: string, wire: WireChunk): void {
        const entry = this.streams.get(requestId);
        if (!entry) return;

        if (entry.closed) return;

        const s = entry.stream;
        if (s.destroyed || (s as any).writableEnded) {
            entry.closed = true;
            return;
        }

        // 1) Handle headers (buffer if res not attached yet)
        if (wire.headers) {
            if (!entry.res) {
                entry.pendingHeaders = wire.headers;
            } else {
                this.applyHeadersOnce(requestId, entry, wire.headers);
            }
        }

        // 2) Enforce: no body until headers are set
        if (wire.body) {
            if (!entry.headersSet) {
                entry.pendingBodies.push(wire.body);
            } else {
                s.push(wire.body);
            }
        }

        // 3) Terminal handling (buffer terminal if we haven't flushed yet)
        if (wire.done) {
            if (!entry.headersSet) {
                entry.pendingDone = true;
            } else {
                entry.closed = true;
                s.end();
            }
        }

        // If headers became set and we have pending, flush now.
        this.flushPending(entry);
    }

    endWire(requestId: string): void {
        const entry = this.streams.get(requestId);
        if (!entry) return;

        if (entry.closed) return;

        const s = entry.stream;
        if (s.destroyed || (s as any).writableEnded) {
            entry.closed = true;
            return;
        }

        entry.closed = true;
        s.end();
    }

    removeStream(requestId: string): void {
        this.streams.delete(requestId);
    }

    private applyHeadersOnce(requestId: string, entry: StreamEntry, headers: Record<string, string>): void {
        const logger = this.mlog(this.applyHeadersOnce);

        if (entry.headersSet) return;
        if (!entry.res) return;

        const res = entry.res;
        if (res.headersSent) {
            logger.warn(`Headers already sent for request ${requestId}; cannot apply wire headers`);
            entry.headersSet = true;
            return;
        }

        for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
        entry.headersSet = true;

        // Force headers out before any body is written (important for SSE clients)
        if (typeof (res as any).flushHeaders === 'function') {
            (res as any).flushHeaders();
        }
    }

    private flushPending(entry: StreamEntry): void {
        if (!entry.headersSet) return;

        const s = entry.stream;
        if (entry.closed || s.destroyed || (s as any).writableEnded) {
            entry.closed = true;
            return;
        }

        while (entry.pendingBodies.length) {
            const chunk = entry.pendingBodies.shift();
            if (chunk) s.push(chunk);
        }

        if (entry.pendingDone) {
            entry.pendingDone = false;
            entry.closed = true;
            s.end();
        }
    }
}