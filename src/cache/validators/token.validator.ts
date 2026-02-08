import {Type, type} from "arktype";
import {Token} from "@holokai/sdk";


export const TokenValidator = type({
    urlSlug: 'string',
    cachedAt: 'number'
}) satisfies Type<Token>
