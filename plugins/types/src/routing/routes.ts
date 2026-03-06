import {Capability} from "../holo";

export const RouteHandler = {
    MODELS: 'models',
    REQUEST: 'request',
    PASSTHROUGH: 'passthrough',
    NOOP: 'noop',
} as const;

export type RouteHandler = typeof RouteHandler[keyof typeof RouteHandler];

export interface RouteDefinition {
    method: 'GET' | 'POST';
    handler: RouteHandler;
    protocol?: string;
    capability: Capability;
}

export type RouteTreeNode = RouteDefinition | { [key: string]: RouteTreeNode };

export interface RouteTree {
    [key: string]: RouteTreeNode;
}
