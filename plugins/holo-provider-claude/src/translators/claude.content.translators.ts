import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import type {HoloContent} from "@holokai/types/holo";
import {ContentBlockParam} from "@anthropic-ai/sdk/resources/messages/messages";

type ImageMime = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

function parseDataUrl(u: string): { media: ImageMime; data: string } | null {
    if (!u.startsWith('data:image/')) return null;
    const comma = u.indexOf(',');
    if (comma < 0) return null;

    const header = u.slice(0, comma);
    const data = u.slice(comma + 1);
    const subtype = header.slice('data:image/'.length).split(';', 1)[0].toLowerCase();
    const media: ImageMime =
        subtype === 'jpeg' || subtype === 'jpg' ? 'image/jpeg' :
            subtype === 'png' ? 'image/png' :
                subtype === 'gif' ? 'image/gif' :
                    subtype === 'webp' ? 'image/webp' : 'image/png';

    return {media, data};
}

@injectable()
export class ClaudeContentTranslator extends BaseTranslator<HoloContent, ContentBlockParam> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<ContentBlockParam> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<ContentBlockParam>> {
        if (source.type === 'text') {
            return {type: 'text', text: source.text};
        }

        const parsed = parseDataUrl(source.url);
        if (parsed) {
            return {type: 'image', source: {type: 'base64', data: parsed.data, media_type: parsed.media}};
        }
        return {type: 'image', source: {type: 'url', url: source.url}};
    }

    protected async toHoloImpl(source: ContentBlockParam): Promise<Partial<HoloContent>> {
        if (source.type === 'text') {
            return {type: 'text', text: source.text};
        }

        if (source.type === 'image') {
            const s = source.source;
            if (s.type === 'base64') {
                return {type: 'image', url: `data:${s.media_type};base64,${s.data}`, mime: s.media_type};
            }
            if (s.type === 'url') {
                return {type: 'image', url: s.url};
            }
        }
        return {};
    }
}
