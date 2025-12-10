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
