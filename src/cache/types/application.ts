import {ProviderType} from "../../providers/types";
import {Model} from "./model";
import {SystemPrompt} from "./system.prompt";
import {Guard} from "./guard";
import {Evaluator} from "./evaluator";

export interface Application {
    urlSlug: string;
    organizationId: string;
    providerType: ProviderType;
    models: Model[];
    systemPrompt?: SystemPrompt;
    guards?: Guard[];
    evaluators?: Evaluator[];
}
