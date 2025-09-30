import {HoloContent, HoloContentImage, HoloContentText} from "./requests";

export * from './requests';
export * from './responses';

export function isText(p: HoloContent): p is HoloContentText {
    return p.type === "text";
}

export function isImage(p: HoloContent): p is HoloContentImage {
    return p.type === "image";
}
