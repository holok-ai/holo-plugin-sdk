import {type, Type} from "arktype";
import type {ProviderConfigProps} from "@holokai/types/config";


export const ProviderValidator = type({
    id: 'string',
    name: 'string',
    type: 'string',
    config: 'Record<string, unknown>'
}) satisfies Type<ProviderConfigProps>;
