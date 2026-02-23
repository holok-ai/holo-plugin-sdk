import {type, Type} from "arktype";
import {ProviderConfigProps} from "@holokai/sdk";


export const ProviderValidator = type({
    id: 'string',
    name: 'string',
    type: 'string',
    config: 'Record<string, unknown>'
}) satisfies Type<ProviderConfigProps>;
