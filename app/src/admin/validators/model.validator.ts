import {type, Type} from "arktype";
import type {ModelConfigProps} from "@holokai/types/config";

export const ModelValidator = type({
    name: 'string',
    accessModel: 'string',
    providerName: 'string',
}) satisfies Type<ModelConfigProps>;