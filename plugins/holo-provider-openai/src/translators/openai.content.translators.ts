import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {HoloContent, HoloContentImage, HoloContentText} from "@holokai/sdk";
import {
    ChatCompletionContentPart,
    ChatCompletionContentPartImage,
    ChatCompletionContentPartText
} from "openai/resources/chat/completions/completions";

@injectable()
export class OpenAITextContentTranslator extends BaseTranslator<HoloContentText, ChatCompletionContentPartText> {
    protected holoDefaults: Partial<HoloContentText> = {};
    protected providerDefaults: Partial<ChatCompletionContentPartText> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContentText): Promise<Partial<ChatCompletionContentPartText>> {
        return {
            type: 'text',
            text: source.text
        };
    }

    protected async toHoloImpl(source: ChatCompletionContentPartText): Promise<Partial<HoloContentText>> {
        return {
            type: 'text',
            text: source.text
        };
    }
}

@injectable()
export class OpenAIImageContentTranslator extends BaseTranslator<HoloContentImage, ChatCompletionContentPartImage> {
    protected holoDefaults: Partial<HoloContentImage> = {};
    protected providerDefaults: Partial<ChatCompletionContentPartImage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContentImage): Promise<Partial<ChatCompletionContentPartImage>> {
        return {
            type: 'image_url',
            image_url: {
                url: source.url
            }
        };
    }

    protected async toHoloImpl(source: ChatCompletionContentPartImage): Promise<Partial<HoloContentImage>> {
        return {
            type: 'image',
            url: source.image_url.url
        };
    }
}

@injectable()
export class OpenAIContentTranslator extends BaseTranslator<HoloContent, ChatCompletionContentPart> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<ChatCompletionContentPart> = {};

    constructor(
        private readonly textContentTranslator: OpenAITextContentTranslator,
        private readonly imageContentTranslator: OpenAIImageContentTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<ChatCompletionContentPart>> {
        switch (source.type) {
            case 'text':
                return await this.textContentTranslator.fromHolo(source);
            case 'image':
                return await this.imageContentTranslator.fromHolo(source);
            default:
                return {};
        }
    }

    protected async toHoloImpl(source: ChatCompletionContentPart): Promise<Partial<HoloContent>> {
        switch (source.type) {
            case 'text':
                return await this.textContentTranslator.toHolo(source as ChatCompletionContentPartText);
            case 'image_url':
                return await this.imageContentTranslator.toHolo(source as ChatCompletionContentPartImage);
            default:
                return {};
        }
    }
}
