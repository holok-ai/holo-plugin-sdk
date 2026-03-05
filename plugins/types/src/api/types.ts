import {Application} from "../entities";

export type TokenType = 'holo_user' | 'holo_application' | 'jwt' | 'anonymous';

export interface Auth {
    organizationId: string;
    userId?: string;
    tokenType: TokenType;
    application?: Application;
    applications: Application[];
    clientIdentifier?: string;
}
