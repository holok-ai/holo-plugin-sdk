import {Response} from 'express';
import {ApplicationConfigProps} from "../config";

export interface Auth {
    organizationId: string;
    userId: string;
    app?: ApplicationConfigProps;
    availableApps: ApplicationConfigProps[];
}

export interface ApiResponse<T = any> extends Response {
    json: (body: T) => this;
}
