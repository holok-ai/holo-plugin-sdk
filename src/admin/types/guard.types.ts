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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
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
    "required": ["passed"],
    "if": {
        "properties": {"passed": {"const": false}}
    },
    "then": {
        "required": ["errors"],
        "properties": {
            "errors": {
                "minItems": 1
            }
        }
    },
    "else": {
        "properties": {
            "errors": false
        }
    },
    "additionalProperties": false
};
