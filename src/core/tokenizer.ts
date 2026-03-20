import {encoding_for_model} from 'tiktoken';

let encoder: ReturnType<typeof encoding_for_model> | undefined;

function getEncoder() {
    if (!encoder) {
        encoder = encoding_for_model('gpt-4o');
    }
    return encoder;
}

export function countTokens(text: string): number {
    return getEncoder().encode(text).length;
}
