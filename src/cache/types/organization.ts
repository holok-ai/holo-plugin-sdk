import {Provider} from "./provider";
import {Application} from "./application";

export interface Organization {
    id: string;
    name: string;
    slug: string;
    providers: Provider[]
    applications: Application[];
}
