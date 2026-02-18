import {NotificationEvent, NotificationEventType, NotificationSubscribeFilter} from "./types";
import {ixKey, parseArray, parseRepeatableParam} from "../core";

export * from './fanout';
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

export const NotificationIndexKey = {
    OA: "oa",     // org + app
    OAU: "oau",   // org + app + user
    OAT: "oat",   // org + app + type
    OATH: "oath", // org + app + thread
    OARQ: "oarq", // org + app + request
    OABR: "oabr", // org + app + branch
} as const;

export type NotificationIndexKey = (typeof NotificationIndexKey)[keyof typeof NotificationIndexKey];

export class NotificationIndexer {
    static readonly APP_WILDCARD = "*";

    // ---- key builders ----
    static oa(orgId: string, appSlug: string) {
        return ixKey(NotificationIndexKey.OA, orgId, appSlug);
    }

    static oau(orgId: string, appSlug: string, userId: string) {
        return ixKey(NotificationIndexKey.OAU, orgId, appSlug, userId);
    }

    static oat(orgId: string, appSlug: string, type: string) {
        return ixKey(NotificationIndexKey.OAT, orgId, appSlug, type);
    }

    static oath(orgId: string, appSlug: string, threadId: string) {
        return ixKey(NotificationIndexKey.OATH, orgId, appSlug, threadId);
    }

    static oarq(orgId: string, appSlug: string, requestId: string) {
        return ixKey(NotificationIndexKey.OARQ, orgId, appSlug, requestId);
    }

    static oabr(orgId: string, appSlug: string, branchId: string) {
        return ixKey(NotificationIndexKey.OABR, orgId, appSlug, branchId);
    }

    // ---- index expansion ----
    /**
     * Build index keys for an incoming event.
     * orgId is required. appSlug is optional; when missing we use a wildcard bucket.
     */
    static keysForEvent(ev: NotificationEvent): string[] {
        const orgId = ev.organizationId;
        const appSlug = this.appSlugOrWildcard(ev.appSlug);

        const out: string[] = [];

        // broad
        out.push(this.oa(orgId, appSlug));

        // narrower
        if (ev.userId) out.push(this.oau(orgId, appSlug, ev.userId));
        out.push(this.oat(orgId, appSlug, ev.type));

        if (ev.threadId) out.push(this.oath(orgId, appSlug, ev.threadId));
        if (ev.requestId) out.push(this.oarq(orgId, appSlug, ev.requestId));
        if (ev.branchId) out.push(this.oabr(orgId, appSlug, ev.branchId));

        return out;
    }

    /**
     * Build index keys for a subscription filter.
     * orgId is required. appSlug optional; when missing we use the wildcard bucket.
     */
    static keysForFilter(f: NotificationSubscribeFilter & { userId?: string; branchIds?: string[] }): string[] {
        const orgId = f.organizationId;
        const appSlug = this.appSlugOrWildcard(f.appSlug);

        const out: string[] = [];

        // broad
        out.push(this.oa(orgId, appSlug));

        // narrower
        if (f.userId) out.push(this.oau(orgId, appSlug, f.userId));

        if (f.types?.length) for (const t of f.types) out.push(this.oat(orgId, appSlug, t));
        if (f.threadIds?.length) for (const id of f.threadIds) out.push(this.oath(orgId, appSlug, id));
        if (f.requestIds?.length) for (const id of f.requestIds) out.push(this.oarq(orgId, appSlug, id));
        if (f.branchIds?.length) for (const id of f.branchIds) out.push(this.oabr(orgId, appSlug, id));

        return out;
    }

    private static appSlugOrWildcard(appSlug?: string): string {
        return appSlug && appSlug.length ? appSlug : this.APP_WILDCARD;
    }

    /**
     * Exact predicate match (post-index). Keeps subscription semantics centralized.
     *
     * Semantics:
     * - orgId: required, must match
     * - appSlug: if filter omits, match any; else must match
     * - arrays (types/threadIds/requestIds/branchIds): if present, event must have field + be included
     * - userId: if present on filter, must match (and event must have it)
     */
    static matches(
        f: NotificationSubscribeFilter & { userId?: string; branchIds?: string[] },
        ev: NotificationEvent
    ): boolean {
        if (f.organizationId !== ev.organizationId) return false;

        // appSlug optional on filter
        const fApp = this.appSlugOrWildcard(f.appSlug);
        const evApp = this.appSlugOrWildcard(ev.appSlug);
        if (fApp !== this.APP_WILDCARD && fApp !== evApp) return false;

        if (f.types?.length && !f.types.includes(ev.type)) return false;

        if (f.threadIds?.length) {
            if (!ev.threadId || !f.threadIds.includes(ev.threadId)) return false;
        }

        if (f.requestIds?.length) {
            if (!ev.requestId || !f.requestIds.includes(ev.requestId)) return false;
        }

        if (f.branchIds?.length) {
            if (!ev.branchId || !f.branchIds.includes(ev.branchId)) return false;
        }

        if (f.userId) {
            if (!ev.userId || ev.userId !== f.userId) return false;
        }

        return true;
    }
}