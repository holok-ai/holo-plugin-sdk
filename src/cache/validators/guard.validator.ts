import {Type, type} from "arktype";
import {Guard} from "../types";

export const GuardValidator = type({
    id: 'string',
    content: 'string'
}) satisfies Type<Guard>;
