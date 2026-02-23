import {ProviderConfigProps} from "./provider";
import {ApplicationConfigProps} from "./application";

export interface OrganizationConfigProps {
    id: string;
    name: string;
    slug: string;
    providers: ProviderConfigProps[]
    applications: ApplicationConfigProps[];
}
