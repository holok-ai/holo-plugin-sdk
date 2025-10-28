import {ProviderType} from "../../providers/types";

export interface Provider {
    id: string;
    name: string;
    type: ProviderType;
    config: Record<string, any>;
}
