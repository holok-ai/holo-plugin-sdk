import type {
    HoloContent,
    HoloContentFile,
    HoloContentImage,
    HoloContentJson,
    HoloContentReasoning,
    HoloContentText,
    HoloContentToolCall,
    HoloContentToolResult,
} from '@holokai/holo-types/holo';

export function isTextContent(p: HoloContent): p is HoloContentText {
    return p.type === "text";
}

export function isImageContent(p: HoloContent): p is HoloContentImage {
    return p.type === "image";
}

export function isReasoningContent(p: HoloContent): p is HoloContentReasoning {
    return p.type === "reasoning";
}

export function isToolCallContent(p: HoloContent): p is HoloContentToolCall {
    return p.type === "tool_call";
}

export function isToolResultContent(p: HoloContent): p is HoloContentToolResult {
    return p.type === "tool_result";
}

export function isJsonContent(p: HoloContent): p is HoloContentJson {
    return p.type === "json";
}

export function isFileContent(p: HoloContent): p is HoloContentFile {
    return p.type === "file";
}
