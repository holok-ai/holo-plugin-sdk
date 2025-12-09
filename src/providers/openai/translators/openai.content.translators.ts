import 'reflect-metadata';
import {
    OpenAIChatCompletionContentPart,
    OpenAIChatCompletionContentPartImage,
    OpenAIChatCompletionContentPartText
} from "../types";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {HoloContent, HoloContentImage, HoloContentText} from "@holokai/sdk";

@injectable()
export class OpenAITextContentTranslator extends BaseTranslator<HoloContentText, OpenAIChatCompletionContentPartText> {
    protected holoDefaults: Partial<HoloContentText> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionContentPartText> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContentText): Promise<Partial<OpenAIChatCompletionContentPartText>> {
        return {
            type: 'text',
            text: source.text
        };
    }

    protected async toHoloImpl(source: OpenAIChatCompletionContentPartText): Promise<Partial<HoloContentText>> {
        return {
            type: 'text',
            text: source.text
        };
    }
}

@injectable()
export class OpenAIImageContentTranslator extends BaseTranslator<HoloContentImage, OpenAIChatCompletionContentPartImage> {
    protected holoDefaults: Partial<HoloContentImage> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionContentPartImage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContentImage): Promise<Partial<OpenAIChatCompletionContentPartImage>> {
        return {
            type: 'image_url',
            image_url: {
                url: source.url
            }
        };
    }

    protected async toHoloImpl(source: OpenAIChatCompletionContentPartImage): Promise<Partial<HoloContentImage>> {
        return {
            type: 'image',
            url: source.image_url.url
        };
    }
}

@injectable()
export class OpenAIContentTranslator extends BaseTranslator<HoloContent, OpenAIChatCompletionContentPart> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionContentPart> = {};

    constructor(
        private readonly textContentTranslator: OpenAITextContentTranslator,
        private readonly imageContentTranslator: OpenAIImageContentTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<OpenAIChatCompletionContentPart>> {
        switch (source.type) {
            case 'text':
                return await this.textContentTranslator.fromHolo(source);
            case 'image':
                return await this.imageContentTranslator.fromHolo(source);
            default:
                return {};
        }
    }

    protected async toHoloImpl(source: OpenAIChatCompletionContentPart): Promise<Partial<HoloContent>> {
        switch (source.type) {
            case 'text':
                return await this.textContentTranslator.toHolo(source as OpenAIChatCompletionContentPartText);
            case 'image_url':
                return await this.imageContentTranslator.toHolo(source as OpenAIChatCompletionContentPartImage);
            default:
                return {};
        }
    }
}
