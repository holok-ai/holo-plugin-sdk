import 'reflect-metadata';
import {OllamaOptions} from "../types";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";
import {HoloRequest} from "@holokai/sdk";
import {BaseTranslator} from "@holokai/sdk/provider";

@injectable()
export class OllamaOptionsTranslator extends BaseTranslator<HoloRequest, OllamaOptions> {
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
