import {type, Type} from "arktype";
import {ModelConfigProps} from "@holokai/sdk";

export const ModelValidator = type({
    name: 'string',
    accessModel: 'string',
    providerName: 'string',
}) satisfies Type<ModelConfigProps>;