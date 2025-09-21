import {Type, type} from "arktype";
import {Evaluator} from "../types";

export const EvaluatorValidator = type({
    id: 'string',
    content: 'string'
}) satisfies Type<Evaluator>;
