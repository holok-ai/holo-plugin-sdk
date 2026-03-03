import 'reflect-metadata';
import {Response} from "express";
import {inject, injectable} from "tsyringe";
import {ClassLogger, pickDefined, stringifyError} from "@holokai/sdk";
import type {
    INotificationService,
    INotificationSub,
    NotificationEvent,
    NotificationSubscribeFilter
} from '@holokai/types/notification';
import {NotificationServiceToken} from '@holokai/sdk/notification';

import {HoloApiRequest} from "../types";

@injectable()
export class NotificationController extends ClassLogger {
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

        const {organizationId, userId, app} = req.auth;

        const filter = pickDefined({
            organizationId,
            userId,
            appSlug: app?.urlSlug
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
            if (filter.userId && ev.userId !== filter.userId) return;
            if (filter.appSlug && ev.appSlug !== filter.appSlug) return;

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
                logger.info(`Received ${JSON.stringify(ev)}`);
                await write(ev);
            }
        } catch (e: any) {
            logger.error(`notification stream error: ${e?.message ?? e}`);

            try {
                await write(pickDefined({
                    id: `err_${Date.now()}`,
                    ts: Date.now(),
                    organizationId,
                    appSlug: app?.urlSlug,
                    userId,
                    type: "provider_error",
                    severity: "error",
                    message: "notification_stream_error",
                    payload: {error: stringifyError(e?.message ?? e)},
                }) as NotificationEvent);
            } catch {
                // ignore
            }

            await close();
        }
    };
}