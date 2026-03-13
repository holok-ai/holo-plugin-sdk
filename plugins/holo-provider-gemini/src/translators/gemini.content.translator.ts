import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import type {HoloContent} from "@holokai/types/holo";
import type {Part} from "@google/genai";

type ImageMime = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

function parseDataUrl(u: string): { mimeType: ImageMime; data: string } | null {
    if (!u.startsWith('data:image/')) return null;
    const comma = u.indexOf(',');
    if (comma < 0) return null;

    const header = u.slice(0, comma);
    const data = u.slice(comma + 1);
    const subtype = header.slice('data:image/'.length).split(';', 1)[0].toLowerCase();
    const mimeType: ImageMime =
        subtype === 'jpeg' || subtype === 'jpg' ? 'image/jpeg' :
            subtype === 'png' ? 'image/png' :
                subtype === 'gif' ? 'image/gif' :
                    subtype === 'webp' ? 'image/webp' : 'image/png';

    return {mimeType, data};
}

@injectable()
export class GeminiContentTranslator extends BaseTranslator<HoloContent, Part> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<Part> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<Part>> {
        if (source.type === 'text') {
            return {text: source.text};
        }

        const parsed = parseDataUrl(source.url);
        if (parsed) {
            return {inlineData: {mimeType: parsed.mimeType, data: parsed.data}};
        }
        return {fileData: {fileUri: source.url, mimeType: source.mime || 'image/png'}};
    }

    protected async toHoloImpl(source: Part): Promise<Partial<HoloContent>> {
        if (source.text !== undefined) {
            return {type: 'text', text: source.text};
        }

        if (source.inlineData) {
            const mime = source.inlineData.mimeType || 'image/png';
            return {type: 'image', url: `data:${mime};base64,${source.inlineData.data}`, mime};
        }

        if (source.fileData) {
            const result: Partial<HoloContent> = {type: 'image', url: source.fileData.fileUri || ''};
            if (source.fileData.mimeType) {
                result.mime = source.fileData.mimeType;
            }
            return result;
        }

        return {};
    }
}
