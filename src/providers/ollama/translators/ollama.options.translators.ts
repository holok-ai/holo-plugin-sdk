import {OllamaOptions} from "../types";
import {HoloRequest, HoloRequestValidator} from "../../holo";
import {OllamaOptionsValidator} from "../validators";
import {FieldTranslator, TranslateFunc} from "../../types";

export const fromHoloOptionsFieldsTranslator: TranslateFunc<HoloRequest, OllamaOptions> =
    async (holoRequest: HoloRequest): Promise<Partial<OllamaOptions>> => {
        const result: any = {};
        if (holoRequest.max_tokens !== undefined) {
            result.num_predict = holoRequest.max_tokens;
        }

        if (holoRequest.stop_sequences?.length) {
            result.stop = holoRequest.stop_sequences;
        }

        return result;
    };
export const toHoloOptionsFieldsTranslator: TranslateFunc<OllamaOptions, HoloRequest> =
    async (options: OllamaOptions): Promise<Partial<HoloRequest>> => {
        const result: Partial<HoloRequest> = {};

        if (options.num_predict !== undefined) {
            result.max_tokens = options.num_predict;
        }

        if (Array.isArray(options.stop) && options.stop.length) {
            result.stop_sequences = options.stop;
        }

        return result;
    };
export const OllamaOptionsTranslator = new FieldTranslator<HoloRequest, OllamaOptions>(
    HoloRequestValidator,
    OllamaOptionsValidator,
    [fromHoloOptionsFieldsTranslator],
    [toHoloOptionsFieldsTranslator],
    {
        name: 'OllamaOptionsTranslator'
    }
);
