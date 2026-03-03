import {Type, type} from "arktype";
import type {Token} from "@holokai/types/config";


export const TokenValidator = type({
    urlSlug: 'string',
    cachedAt: 'number'
}) satisfies Type<Token>
