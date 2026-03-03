import type {HoloContent, HoloContentImage, HoloContentText} from '@holokai/types/holo';

export function isTextContent(p: HoloContent): p is HoloContentText {
    return p.type === "text";
}

export function isImageContent(p: HoloContent): p is HoloContentImage {
    return p.type === "image";
}
