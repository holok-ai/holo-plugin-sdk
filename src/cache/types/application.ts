import {Model} from "./model";
import {Prompt} from "./prompt";

export interface Application {
    urlSlug: string;
    organizationId: string;
    providerName: string;
    providerType: string;
    models: Model[];
    systemPrompt?: Prompt;
    guards?: Prompt[];
    evaluators?: Prompt[];
}
