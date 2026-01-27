import {type, Type} from "arktype";
import {Provider} from "../types";


export const ProviderValidator = type({
    id: 'string',
    name: 'string',
    type: 'string',
    config: 'Record<string, unknown>'
}) satisfies Type<Provider>;
