import {FieldTranslator, TranslateFunc,} from "../../types";
import {
    HoloContent,
    HoloContentImage,
    HoloContentImageValidator,
    HoloContentText,
    HoloContentTextValidator,
    HoloContentValidator
} from "../../holo";
import {
    OpenAIChatCompletionContentPartImageValidator,
    OpenAIChatCompletionContentPartTextValidator,
    OpenAIChatCompletionContentPartValidator
} from "../validators";
import {
    OpenAIChatCompletionContentPart,
    OpenAIChatCompletionContentPartImage,
    OpenAIChatCompletionContentPartText
} from "../types";

export const fromHoloTextContentTranslator: TranslateFunc<HoloContentText, OpenAIChatCompletionContentPartText> =
    async (holoText: HoloContentText): Promise<Partial<OpenAIChatCompletionContentPartText>> => ({
        type: 'text',
        text: holoText.text
    });

export const fromHoloImageContentTranslator: TranslateFunc<HoloContentImage, OpenAIChatCompletionContentPartImage> =
    async (holoImage: HoloContentImage): Promise<Partial<OpenAIChatCompletionContentPartImage>> => ({
        type: 'image_url',
        image_url: {
            url: holoImage.url
        }
    });

export const toHoloTextContentTranslator: TranslateFunc<OpenAIChatCompletionContentPartText, HoloContentText> =
    async (openaiText: OpenAIChatCompletionContentPartText): Promise<Partial<HoloContentText>> => ({
        type: 'text',
        text: openaiText.text
    });

export const toHoloImageContentTranslator: TranslateFunc<OpenAIChatCompletionContentPartImage, HoloContentImage> =
    async (openaiImage: OpenAIChatCompletionContentPartImage): Promise<Partial<HoloContentImage>> => ({
        type: 'image',
        url: openaiImage.image_url.url
    });

export const OpenAITextContentTranslator = new FieldTranslator<HoloContentText, OpenAIChatCompletionContentPartText>(
    HoloContentTextValidator,
    OpenAIChatCompletionContentPartTextValidator,
    [fromHoloTextContentTranslator],
    [toHoloTextContentTranslator],
    {
        name: 'OpenAITextContentTranslator'
    }
);

export const OpenAIImageContentTranslator = new FieldTranslator<HoloContentImage, OpenAIChatCompletionContentPartImage>(
    HoloContentImageValidator,
    OpenAIChatCompletionContentPartImageValidator,
    [fromHoloImageContentTranslator],
    [toHoloImageContentTranslator],
    {
        name: 'OpenAIImageContentTranslator'
    }
);

export const fromHoloContentTranslator: TranslateFunc<HoloContent, OpenAIChatCompletionContentPart> =
    async (holoContent: HoloContent): Promise<Partial<OpenAIChatCompletionContentPart>> => {
        switch (holoContent.type) {
            case 'text':
                return await OpenAITextContentTranslator.fromHolo(holoContent);
            case 'image':
                return await OpenAIImageContentTranslator.fromHolo(holoContent);
            default:
                return {};
        }
    };

export const toHoloContentTranslator: TranslateFunc<OpenAIChatCompletionContentPart, HoloContent> =
    async (openaiContent: OpenAIChatCompletionContentPart): Promise<Partial<HoloContent>> => {
        switch (openaiContent.type) {
            case 'text':
                return await OpenAITextContentTranslator.toHolo(openaiContent as OpenAIChatCompletionContentPartText);
            case 'image_url':
                return await OpenAIImageContentTranslator.toHolo(openaiContent as OpenAIChatCompletionContentPartImage);
            default:
                return {};
        }
    };

export const OpenAIContentTranslator = new FieldTranslator<HoloContent, OpenAIChatCompletionContentPart>(
    HoloContentValidator,
    OpenAIChatCompletionContentPartValidator,
    [fromHoloContentTranslator],
    [toHoloContentTranslator],
    {
        name: 'OpenAIContentTranslator'
    }
);
