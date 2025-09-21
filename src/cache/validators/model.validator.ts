import {Type, type} from "arktype";
import {Model} from "../types";

export const ModelValidator = type({
    name: 'string',
    accessModel: 'string'
}) satisfies Type<Model>;
