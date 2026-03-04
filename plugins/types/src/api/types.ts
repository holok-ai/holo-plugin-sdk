import {ApplicationConfigProps} from "../config";
import {Application} from "../entities";

export interface Auth {
    organizationId: string;
    userId: string;
    app?: ApplicationConfigProps;
    availableApps: ApplicationConfigProps[];
    application?: Application;
    applications: Application[];
}
