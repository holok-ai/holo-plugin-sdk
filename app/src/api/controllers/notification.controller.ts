import 'reflect-metadata';
import {Response} from "express";
import {inject, injectable} from "tsyringe";
import {pickDefined, stringifyAny} from "@holokai/sdk";
import {BaseController} from "../../utils";
import type {
    INotificationService,
    INotificationSub,
    NotificationEvent,
    NotificationSubscribeFilter
} from '@holokai/types/notification';
import {NotificationServiceToken} from '@holokai/sdk/notification';

import {HoloApiRequest} from "../types";

function normalizeQueryValues(...values: unknown[]): string[] | undefined {
    const normalized = values
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .flatMap((value) => typeof value === "string" ? value.split(",") : [])
        .map((value) => value.trim())
        .filter(Boolean);

    return normalized.length ? normalized : undefined;
}

@injectable()
export class NotificationController extends BaseController {
    constructor(
        @inject(NotificationServiceToken) private readonly notificationService: INotificationService) {
        super();
    }

    stream = async (req: HoloApiRequest, res: Response) => {
        const logger = this.mlog(this.stream);

        if (!req.auth) {
            res.status(401).send({});
            return;
        }

        const {organizationId, userId, clientIdentifier, application} = req.auth;
        const threadIds = normalizeQueryValues(req.query.threadId, req.query.threadIds, req.query.thread_id);

        const filter = pickDefined({
            organizationId,
            userId: userId ?? clientIdentifier,
            appSlug: application?.url_slug,
            threadIds,
        }) as NotificationSubscribeFilter;

        // SSE headers
        res.status(200);
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no"); // nginx buffering off
        res.flushHeaders?.();
        res.write(`retry: 1500\n\n`);

        // Heartbeat
        const hb = setInterval(() => {
            res.write(`: ping ${Date.now()}\n\n`);
        }, 25_000);

        let sub: INotificationSub | undefined;

        let closed = false;

        const close = async () => {
            if (closed) return;
            closed = true;
            clearInterval(hb);

            try {
                if (sub) await this.notificationService.unsubscribe(sub.id);
            } catch (e) {
                // best-effort
            }

            try {
                res.end();
            } catch {
                // ignore
            }
        };

        req.on("close", close);
        req.on("error", close);

        const write = async (ev: NotificationEvent) => {
            if (closed) return;
            if (ev.organizationId !== organizationId) return;
            if (filter.appSlug && ev.appSlug !== filter.appSlug) return;
            const matchesUser = filter.userId ? ev.userId === filter.userId : false;
            if (!matchesUser) {
                const matchesThread = !!ev.threadId && !!filter.threadIds?.includes(ev.threadId);
                if (!matchesThread) return;
            }

            const chunk =
                `id: ${ev.id}\n` +
                `event: ${ev.type}\n` +
                `data: ${JSON.stringify(ev)}\n\n`;

            if (!res.write(chunk)) {
                await new Promise<void>((resolve) => res.once("drain", resolve));
            }
        };

        try {
            sub = await this.notificationService.subscribe(filter);
            for await (const ev of sub.q) {
                await write(ev);
            }

            await close();
        } catch (e: any) {
            logger.error(`notification stream error: ${e?.message ?? e}`);

            try {
                await write(pickDefined({
                    id: `err_${Date.now()}`,
                    ts: Date.now(),
                    organizationId,
                    appSlug: application?.url_slug,
                    userId,
                    type: "provider_error",
                    severity: "error",
                    message: "notification_stream_error",
                    payload: {error: stringifyAny(e?.message ?? e)},
                }) as NotificationEvent);
            } catch {
                // ignore
            }

            await close();
        }
    };
}
