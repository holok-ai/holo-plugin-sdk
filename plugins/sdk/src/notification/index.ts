import {NotificationEventType} from "./types";
import {parseArray, parseRepeatableParam} from "../core";

export * from './store';
export * from './types';

export function parseEventTypes(q: unknown): NotificationEventType[] | undefined {
    const raw = parseArray(parseRepeatableParam(q));
    if (!raw.length) return undefined;

    // Option A: trust input (fast, but unsafe)
    // return raw as NotificationEventType[];

    // Option B: validate (recommended)
    const allowed = new Set<NotificationEventType>([
        "guard_started", "guard_passed", "guard_failed", "status",
        "provider_request_started", "provider_response_completed", "provider_error",
    ]);
    const out = raw.filter((t): t is NotificationEventType => allowed.has(t as NotificationEventType));
    return out.length ? out : undefined;
}