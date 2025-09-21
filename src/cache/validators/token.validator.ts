import {Type, type} from "arktype";
import {Token} from "../types";


export const TokenValidator = type({
    urlSlug: 'string',
    cachedAt: 'number'
}) satisfies Type<Token>
