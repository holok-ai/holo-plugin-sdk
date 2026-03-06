import {BaseEntity} from "./base";
import {Provider} from "./provider";
import {Model} from "./model";
import {Prompt} from "./prompt";
import {Evaluator} from "./evaluator";

export type AccessLevel = 'team' | 'organization' | 'anonymous';

export interface Application extends BaseEntity {
    name: string;
    provider_id: string;
    system_prompt_id: string;
    url_slug: string;
    active: boolean;
    organization_id: string;
    access_level: AccessLevel;
    provider?: Provider;
    models?: Model[];
    system_prompt?: Prompt;
    guards?: Prompt[];
    evaluators?: Evaluator[];
}
