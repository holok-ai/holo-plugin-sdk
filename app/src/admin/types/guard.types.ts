import {type} from "arktype";

export interface GuardResultPass {
    passed: true;
}

export interface GuardResultFail {
    passed: false;
    errors: string[];
}

export type GuardResult = GuardResultPass | GuardResultFail;

export const GuardResultPassValidator = type({passed: 'true'}).brand('GuardResultPassValidator') satisfies type<GuardResultPass>;

export const GuardResultFailValidator = type({
    passed: 'false', errors: 'string[]'
}).brand('GuardResultFailValidator') satisfies type<GuardResultFail>;

export const GuardResultValidator = GuardResultPassValidator.or(GuardResultFailValidator).brand('GuardResultValidator') satisfies type<GuardResult>;

export const GuardResultSchema = {
    "type": "object",
    "properties": {
        "passed": {
            "type": "boolean"
        },
        "errors": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": ["passed", "errors"],
    "additionalProperties": false
};
