import {ProviderType} from "../../providers/types";
import {Model} from "./model";
import {Prompt} from "./prompt";

export interface Application {
    urlSlug: string;
    organizationId: string;
    providerType: ProviderType;
    models: Model[];
    systemPrompt?: Prompt;
    guards?: Prompt[];
    evaluators?: Prompt[];
}
