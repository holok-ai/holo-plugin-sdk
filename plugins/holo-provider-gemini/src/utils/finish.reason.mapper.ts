import type {HoloFinishReason} from '@holokai/types/holo';

const geminiToHolo: Record<string, HoloFinishReason> = {
    'STOP': 'stop',
    'MAX_TOKENS': 'length',
    'SAFETY': 'content_filter',
    'RECITATION': 'content_filter',
    'OTHER': 'stop',
};

const holoToGemini: Record<string, string> = {
    'stop': 'STOP',
    'length': 'MAX_TOKENS',
    'tool_calls': 'STOP',
    'content_filter': 'SAFETY',
    'function_call': 'STOP',
};

export function toHoloFinishReason(geminiReason: string | undefined): HoloFinishReason | undefined {
    if (!geminiReason) return undefined;
    return geminiToHolo[geminiReason] ?? 'stop';
}

export function toGeminiFinishReason(holoReason: HoloFinishReason | undefined): string | undefined {
    if (!holoReason) return undefined;
    return holoToGemini[holoReason] ?? 'STOP';
}
