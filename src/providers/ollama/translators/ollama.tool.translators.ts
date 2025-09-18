import {HoloTool, HoloToolValidator} from "../../holo";
import {OllamaTool, OllamaToolValidator} from "../types";
import {FieldTranslator, TranslateFunc} from "../../types";

// Individual translator functions for tools
export const fromHoloToolTranslator: TranslateFunc<HoloTool, OllamaTool> =
    async (holoTool: HoloTool): Promise<Partial<OllamaTool>> => {
        // Ollama expects proper JSON Schema format
        const parameters = holoTool.parameters || {};

        // If parameters is already a proper JSON Schema, use it directly
        // Otherwise, wrap it in a JSON Schema structure
        let jsonSchemaParameters;
        if (typeof parameters === 'object' && parameters !== null && 'type' in parameters) {
            // Already looks like JSON Schema
            jsonSchemaParameters = parameters;
        } else {
            // Convert Record<string, unknown> to JSON Schema format
            jsonSchemaParameters = {
                type: 'object',
                properties: parameters,
                required: [] // Default to no required fields
            };
        }

        const result: Partial<OllamaTool> = {
            type: 'function',
            function: {
                name: holoTool.name,
                parameters: jsonSchemaParameters
            }
        };

        // Only add description if it exists
        if (holoTool.description) {
            result.function!.description = holoTool.description;
        }

        return result;
    };

export const toHoloToolTranslator: TranslateFunc<OllamaTool, HoloTool> =
    async (ollamaTool: OllamaTool): Promise<Partial<HoloTool>> => {
        // Extract parameters from JSON Schema format
        let parameters = ollamaTool.function.parameters;

        // If it's a JSON Schema object with properties, extract just the properties
        if (parameters && typeof parameters === 'object' && 'properties' in parameters) {
            parameters = (parameters as any).properties || {};
        }

        const result: Partial<HoloTool> = {
            name: ollamaTool.function.name || ''
        };

        // Only add description if it exists
        if (ollamaTool.function.description) {
            result.description = ollamaTool.function.description;
        }

        // Only add parameters if they exist and are valid
        if (parameters && typeof parameters === 'object') {
            result.parameters = parameters as Record<string, unknown>;
        }

        return result;
    };

// Individual tool translator
export const OllamaToolTranslator = new FieldTranslator<HoloTool, OllamaTool>(
    HoloToolValidator,
    OllamaToolValidator,
    [fromHoloToolTranslator],
    [toHoloToolTranslator]
);
