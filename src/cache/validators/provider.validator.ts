import {type, Type} from "arktype";
import {Provider} from "../types";
import {ProviderType} from "../../providers/types";


export const ProviderValidator = type({
    id: 'string',
    name: 'string',
    type: type.valueOf(ProviderType),
    config: 'Record<string, unknown>'
}) satisfies Type<Provider>;
