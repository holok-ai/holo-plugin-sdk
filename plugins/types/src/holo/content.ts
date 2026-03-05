export interface HoloContentText {
    type: 'text';
    text: string;
}

export interface HoloContentImage {
    type: 'image';
    url: string;
    mime?: string;
    alt_text?: string;
}

export type HoloContent = HoloContentText | HoloContentImage;
