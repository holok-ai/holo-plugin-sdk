import 'reflect-metadata';
import {ClaudeContentBlockParam} from "../types";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {HoloContent} from "@holokai/sdk";

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
export class ClaudeContentTranslator extends BaseTranslator<HoloContent, ClaudeContentBlockParam> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<ClaudeContentBlockParam> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<ClaudeContentBlockParam>> {
        if (source.type === 'text') {
            return {type: 'text', text: source.text};
        }

        const parsed = parseDataUrl(source.url);
        if (parsed) {
            return {type: 'image', source: {type: 'base64', data: parsed.data, media_type: parsed.media}};
        }
        return {type: 'image', source: {type: 'url', url: source.url}};
    }

    protected async toHoloImpl(source: ClaudeContentBlockParam): Promise<Partial<HoloContent>> {
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
