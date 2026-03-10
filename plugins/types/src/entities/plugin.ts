import {BaseEntity} from "./base";
import {PluginType} from "../plugin";

export interface Plugin extends BaseEntity {
    family: string;
    name: string;
    type: PluginType;
    version: string;
    is_default: boolean;
    default_pricing_plan_id?: string;
    active: boolean;
}
