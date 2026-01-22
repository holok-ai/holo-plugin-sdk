import {RequestType} from "../holo";

export enum RouteHandler {
    MODELS = 'models',
    REQUEST = 'request'
}

export type RouteDefinition = {
    method: 'GET' | 'POST';
    handler: RouteHandler;
    requestType?: RequestType;
};

export type RouteTreeNode = RouteDefinition | { [key: string]: RouteTreeNode };

export type RouteTree = {
    [key: string]: RouteTreeNode;
};