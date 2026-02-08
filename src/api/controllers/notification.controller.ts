import 'reflect-metadata';
import {Response} from "express";
import {injectable} from "tsyringe";
import {
    ClassLogger,
    NotificationEvent,
    NotificationFanout,
    NotificationStore,
    NotificationSubscribeFilter,
    parseArray,
    parseEventTypes,
    parseLimit,
    parseRepeatableParam,
    stringifyError
} from "@holokai/sdk";
import {HoloApiRequest} from "../types";

@injectable()
export class NotificationController extends ClassLogger {
    constructor(
        private readonly store: NotificationStore,
        private readonly fanout: NotificationFanout
    ) {
        super();
    }

    stream = async (req: HoloApiRequest, res: Response) => {
        const logger = this.mlog(this.stream);
        const {organizationId, userId, app} = req.auth;

        const threadIds = parseArray(parseRepeatableParam(req.query.threadId));
        const requestIds = parseArray(parseRepeatableParam(req.query.requestId));
        const types = parseEventTypes(req.query.type);

        const afterId = req.header("Last-Event-ID") ?? undefined;
        const limit = parseLimit(req.query.limit, 250);

        const filter: NotificationSubscribeFilter = {
            organizationId,
            appSlug: app.urlSlug,
            ...(threadIds.length ? {threadIds} : {}),
            ...(requestIds.length ? {requestIds} : {}),
            ...(types?.length ? {types} : {}),
            ...(afterId ? {afterId} : {}),
        };

        // SSE headers
        res.status(200);
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        const hb = setInterval(() => res.write(`: ping\n\n`), 25_000);

        const close = () => {
            clearInterval(hb);
            try {
                res.end();
            } catch {
            }
        };

        req.on("close", close);
        req.on("error", close);

        try {
            // Optional replay (only if afterId exists)
            if (afterId) {
                const items = await this.store.query({
                    ...filter,
                    afterId,
                    limit
                });
                for (const ev of items) this.writeSse(res, ev);
            }

            // Live
            for await (const ev of this.fanout.subscribe(filter)) {
                this.writeSse(res, ev);
            }
        } catch (e: any) {
            logger.error(`notification stream error: ${e?.message ?? e}`, {
                organizationId,
                userId,
                appSlug: app.urlSlug
            });
            // cannot change HTTP status mid-stream; emit an event
            this.writeSse(res, {
                id: `err_${Date.now()}`,
                ts: Date.now(),
                organizationId,
                appSlug: app.urlSlug,
                userId,
                type: "provider_error",
                severity: "error",
                message: "notification_stream_error",
                payload: {error: stringifyError(e?.message ?? e)}
            });
            close();
        }
    };

    private writeSse(res: Response, ev: NotificationEvent) {
        res.write(`id: ${ev.id}\n`);
        res.write(`event: ${ev.type}\n`);
        res.write(`data: ${JSON.stringify(ev)}\n\n`);
    }
}