import {ProtocolDef} from "../entities";

export const RouteHandler = {
    MODELS: 'models',
    REQUEST: 'request',
    PASSTHROUGH: 'passthrough',
    NOOP: 'noop',
} as const;

export type RouteHandler = typeof RouteHandler[keyof typeof RouteHandler];

export function isRouteDefinition(value: any): value is RouteDefinition {
    return value && typeof value === 'object' && 'method' in value && 'handler' in value;
}

export interface RouteDefinition {
    paths: string[];
    method: 'GET' | 'POST';
    handler: RouteHandler;
    protocol: ProtocolDef;
    streaming?: boolean;
}