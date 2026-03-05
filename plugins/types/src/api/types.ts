import {ApplicationConfigProps} from "../config";

export interface Auth {
    organizationId: string;
    userId: string;
    app?: ApplicationConfigProps;
    availableApps: ApplicationConfigProps[];
}
