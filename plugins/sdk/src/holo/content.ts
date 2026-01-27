export interface HoloContentText {
    type: 'text';
    text: string;
}

export interface HoloContentImage {
    type: 'image';
    url: string;          // HTTPS URL or base64 data: URI
    mime?: string;        // MIME type for base64 payloads, e.g., "image/png"
    alt_text?: string;    // Accessibility text (portable; safe to drop on emit)
}

// Union of all portable content types
export type HoloContent = HoloContentText | HoloContentImage;

export function isTextContent(p: HoloContent): p is HoloContentText {
    return p.type === "text";
}

export function isImageContent(p: HoloContent): p is HoloContentImage {
    return p.type === "image";
}