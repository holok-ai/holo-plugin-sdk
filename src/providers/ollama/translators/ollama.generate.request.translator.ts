import 'reflect-metadata';
import {BaseTranslator} from "../../base.translator";
import {HoloMessage, HoloRequest, HoloRequestDefaults, HoloRequestValidator, isImage, isText} from "../../holo";
import {OllamaGenerateRequest} from "../types";
import {OllamaGenerateRequestValidator} from "../validators";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";

@injectable()
export class OllamaGenerateRequestTranslator extends BaseTranslator<HoloRequest, OllamaGenerateRequest> {

    protected holoDefaults = HoloRequestDefaults;
    protected holoValidator = HoloRequestValidator;
    protected providerDefaults: any;
    protected providerValidator = OllamaGenerateRequestValidator;

    constructor() {
        super();
    }

    private extractPromptAndImages(
        msg?: HoloMessage
    ) {
        if (!msg?.content) return {};

        if (typeof msg.content === "string") {
            return {prompt: msg.content};
        }

        const parts = msg.content; // HoloContent[]
        const prompt = parts.filter(isText).map(p => p.text).join("\n") || undefined;
        const imagesArr = parts.filter(isImage).map(p => p.url);
        const images = imagesArr.length ? imagesArr : undefined;

        return pickDefined({prompt, images});
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<OllamaGenerateRequest>> {
        const first = source.messages?.[0];
        const {prompt, images} = this.extractPromptAndImages(first);

        const options = pickDefined({
            temperature: source.temperature,
            top_p: source.top_p,
            top_k: source.top_k,
            num_predict: source.max_tokens,
            stop: source.stop_sequences,
            frequency_penalty: source.frequency_penalty,
            presence_penalty: source.presence_penalty,
            seed: source.seed,
        });

        const format =
            source.response_format?.type === "json_object"
                ? "json"
                : source.response_format?.type === "json_schema"
                    ? (source.response_format.schema as Record<string, unknown>)
                    : undefined;

        return pickDefined({
            model: source.model,
            stream: source.stream,
            system: source.system,
            prompt,
            images,
            options: Object.keys(options).length ? options : undefined,
            format
        }) as Partial<OllamaGenerateRequest>;
    }

    protected async toHoloImpl(source: OllamaGenerateRequest): Promise<Partial<HoloRequest>> {
        const o = source.options ?? {};

        const stop_sequences =
            o.stop == null ? undefined : Array.isArray(o.stop) ? o.stop : [o.stop];

        return pickDefined({
            model: source.model,
            stream: source.stream,
            system: source.system,
            messages: source.prompt ? [{role: "user", content: source.prompt}] : undefined,
            temperature: o.temperature,
            top_p: o.top_p,
            top_k: o.top_k,
            max_tokens: o.num_predict,
            frequency_penalty: o.frequency_penalty,
            presence_penalty: o.presence_penalty,
            seed: o.seed,
            stop_sequences,
            response_format:
                typeof source.format === "string"
                    ? (source.format === "json" ? {type: "json_object"} : undefined)
                    : typeof source.format === "object"
                        ? {type: "json_schema", schema: source.format as Record<string, unknown>}
                        : undefined,
        }) as Partial<HoloRequest>;
    }
}
