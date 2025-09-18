import {FieldTranslator, Guard, TranslateFunc} from "../../translators";
import {
    HoloContent,
    HoloContentImage,
    HoloContentImageValidator,
    HoloContentText,
    HoloContentTextValidator,
    HoloContentValidator
} from "../../holo";
import {ClaudeContentBlockParam, ClaudeImageBlockParam, ClaudeTextBlockParam} from "../types";
import {
    ClaudeContentBlockParamValidator,
    ClaudeImageBlockParamValidator,
    ClaudeTextBlockParamValidator
} from "../claude.request.validators";

// Helper function to detect media type from data URI or default
const detectMediaType = (url: string): 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' => {
    if (url.startsWith('data:image/')) {
        const match = url.match(/^data:image\/([^;]+)/);
        return match ? `image/${match[1]}` as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' : 'image/png';
    }
    return 'image/png'; // Default
};

// Individual specialized translators
export const fromHoloTextContentTranslator: TranslateFunc<HoloContentText, ClaudeTextBlockParam> =
    async (holoText: HoloContentText): Promise<Partial<ClaudeTextBlockParam>> => ({
        type: 'text',
        text: holoText.text
    });

export const fromHoloImageContentTranslator: TranslateFunc<HoloContentImage, ClaudeImageBlockParam> =
    async (holoImage: HoloContentImage): Promise<Partial<ClaudeImageBlockParam>> => {
        if (holoImage.url.startsWith('data:')) {
            // Data URI - convert to Claude base64 format
            const [_header, data] = holoImage.url.split(',');
            const mediaType = detectMediaType(holoImage.url);
            return {
                type: 'image',
                source: {
                    type: 'base64',
                    data: data,
                    media_type: mediaType
                }
            };
        } else {
            // HTTPS URL - convert to Claude URL format
            return {
                type: 'image',
                source: {
                    type: 'url',
                    url: holoImage.url
                }
            };
        }
    };

export const toHoloTextContentTranslator: TranslateFunc<ClaudeTextBlockParam, HoloContentText> =
    async (claudeText: ClaudeTextBlockParam): Promise<Partial<HoloContentText>> => ({
        type: 'text',
        text: claudeText.text
    });

export const toHoloImageContentTranslator: TranslateFunc<ClaudeImageBlockParam, HoloContentImage> =
    async (claudeImage: ClaudeImageBlockParam): Promise<Partial<HoloContentImage>> => {
        const {source} = claudeImage;
        if (source.type === 'base64' && source.data && source.media_type) {
            return {
                type: 'image',
                url: `data:${source.media_type};base64,${source.data}`,
                mime: source.media_type
            };
        } else if (source.type === 'url' && source.url) {
            return {
                type: 'image',
                url: source.url
            };
        }
        // Ignore unsupported image sources - return empty object
        return {};
    };

// Individual specialized content translators
export const ClaudeTextContentTranslator = new FieldTranslator<HoloContentText, ClaudeTextBlockParam>(
    HoloContentTextValidator,
    ClaudeTextBlockParamValidator,
    [fromHoloTextContentTranslator],
    [toHoloTextContentTranslator]
);

export const ClaudeImageContentTranslator = new FieldTranslator<HoloContentImage, ClaudeImageBlockParam>(
    HoloContentImageValidator,
    ClaudeImageBlockParamValidator,
    [fromHoloImageContentTranslator],
    [toHoloImageContentTranslator]
);

// Orchestrating translator functions that delegate to specialized translators
export const fromHoloContentTranslator: TranslateFunc<HoloContent, ClaudeContentBlockParam> =
    async (holoContent: HoloContent): Promise<Partial<ClaudeContentBlockParam>> => {
        switch (holoContent.type) {
            case 'text':
                return await ClaudeTextContentTranslator.fromHolo(holoContent);
            case 'image':
                return await ClaudeImageContentTranslator.fromHolo(holoContent);
            default:
                // Ignore unsupported content types - return empty object
                return {};
        }
    };

export const toHoloContentTranslator: TranslateFunc<ClaudeContentBlockParam, HoloContent> =
    async (claudeContent: ClaudeContentBlockParam): Promise<Partial<HoloContent>> => {
        switch (claudeContent.type) {
            case 'text':
                return await ClaudeTextContentTranslator.toHolo(claudeContent as ClaudeTextBlockParam);
            case 'image':
                return await ClaudeImageContentTranslator.toHolo(claudeContent as ClaudeImageBlockParam);
            default:
                // Ignore non-portable content types - return empty object
                return {};
        }
    };


export const portableContentOnlyGuard = new Guard<ClaudeContentBlockParam>(
    "portableContentOnly",
    (content) => {
        return content.type === 'text' || content.type === 'image';
    }
);

// Single unified content translator
export const ClaudeContentTranslator = new FieldTranslator<HoloContent, ClaudeContentBlockParam>(
    HoloContentValidator,              // Input validator (HoloContent union)
    ClaudeContentBlockParamValidator,  // Output validator (Claude content union)
    [fromHoloContentTranslator],       // Holo → Claude transformer
    [toHoloContentTranslator],         // Claude → Holo transformer
    [],                               // Pre-transform guards for Holo → Claude
    [portableContentOnlyGuard]        // Pre-transform guards for Claude → Holo (filters non-portable)
);
