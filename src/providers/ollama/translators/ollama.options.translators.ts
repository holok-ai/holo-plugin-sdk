import 'reflect-metadata';
import {OllamaOptions} from "../types";
import {HoloRequest, HoloRequestValidator} from "../../holo";
import {OllamaOptionsValidator} from "../validators";
import {BaseTranslator} from "../../base.translator";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";

@injectable()
export class OllamaOptionsTranslator extends BaseTranslator<HoloRequest, OllamaOptions> {
    protected holoValidator = HoloRequestValidator;
    protected providerValidator = OllamaOptionsValidator;
    protected holoDefaults: Partial<HoloRequest> = {};
    protected providerDefaults: Partial<OllamaOptions> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<OllamaOptions>> {
        return pickDefined({
            num_predict: source.max_tokens,
            stop: source.stop_sequences?.length ? source.stop_sequences : undefined
        }) as Partial<OllamaOptions>;
    }

    protected async toHoloImpl(source: OllamaOptions): Promise<Partial<HoloRequest>> {
        return pickDefined({
            max_tokens: source.num_predict,
            stop_sequences: Array.isArray(source.stop) && source.stop.length ? source.stop : undefined
        }) as Partial<HoloRequest>;
    }
}
