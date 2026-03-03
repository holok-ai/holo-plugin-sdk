import {ModelConfigProps} from "./model";
import {PromptConfigProps} from "./prompt";

export interface ApplicationConfigProps {
    urlSlug: string;
    organizationId: string;
    providerName: string;
    providerType: string;
    models: ModelConfigProps[];
    systemPrompt?: PromptConfigProps;
    guards?: PromptConfigProps[];
    evaluators?: PromptConfigProps[];
}
