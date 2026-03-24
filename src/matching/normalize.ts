import {pickDefined} from '../core/pick-defined';

export interface NormalizedModel {
    raw: string;
    normalized: string;
    tokens: string[];
    providerHint?: string;
    familyHint?: string;
    versionHint?: string;
    sizeHint?: string;
    variantHint?: string;
    channelHint?: string;
    dateHint?: string;
    kindHint?: string;
}

const PROVIDER_PREFIXES = [
    'anthropic/', 'openai/', 'google/', 'meta-llama/', 'meta/', 'mistralai/',
    'cohere/', 'deepseek/', 'qwen/',
    'ollama/', 'lmstudio/', 'openrouter/', 'azure/',
    'models/',
];

const PREFIX_TO_PROVIDER: Record<string, string> = {
    'anthropic': 'anthropic',
    'openai': 'openai',
    'google': 'google',
    'meta-llama': 'meta',
    'meta': 'meta',
    'mistralai': 'mistral',
    'cohere': 'cohere',
    'deepseek': 'deepseek',
    'qwen': 'qwen',
    'ollama': 'ollama',
    'lmstudio': 'lmstudio',
    'openrouter': 'openrouter',
    'azure': 'azure',
};

const PREFIX_TO_FAMILY: Record<string, string> = {
    'anthropic': 'claude',
    'google': 'gemini',
    'meta-llama': 'llama',
    'meta': 'llama',
};

const FAMILY_PATTERNS: Array<[RegExp, string]> = [
    [/\bclaude/, 'claude'],
    [/\bgemini/, 'gemini'],
    [/\bgpt/, 'gpt'],
    [/(?:^|-)o[1-9](?:-|$)/, 'o-series'],
    [/\bllama/, 'llama'],
    [/\bqwen/, 'qwen'],
    [/\bmi[sx]tral/, 'mistral'],
    [/\bdeepseek/, 'deepseek'],
    [/\bcohere/, 'cohere'],
    [/\bcommand/, 'cohere'],
    [/\bphi/, 'phi'],
    [/\bgemma/, 'gemma'],
];

const SEMANTIC_VARIANTS = ['opus', 'sonnet', 'haiku', 'pro', 'flash', 'mini', 'nano', 'instruct', 'coder', 'turbo'];
const CHANNEL_MARKERS = ['latest', 'preview'];
const ALL_VARIANT_TOKENS = [...SEMANTIC_VARIANTS, ...CHANNEL_MARKERS];
const VARIANT_PATTERN = new RegExp(`\\b(${ALL_VARIANT_TOKENS.join('|')})\\b`, 'g');

const VARIANT_PRIORITY = Object.fromEntries(
    SEMANTIC_VARIANTS.map((v, i) => [v, SEMANTIC_VARIANTS.length - i]),
);

const SIZE_PATTERN = /\b(\d+x\d+b|\d+(?:\.\d+)?b)\b/;
const DATE_TRAILING_COMPACT = /-(\d{4})(\d{2})(\d{2})$/;
const DATE_TRAILING_HYPHEN = /-(\d{4})-(\d{2})-(\d{2})$/;

const KIND_SIGNALS: Array<[RegExp, string]> = [
    [/\bembed/, 'embedding'],
    [/\btts\b/, 'tts'],
    [/\bwhisper\b/, 'transcription'],
    [/\brerank\b/, 'rerank'],
    [/\bmoderat/, 'moderation'],
    [/\bimage\b|\bdall-?e\b|\bstable-?diffusion\b/, 'image'],
];

export function normalizeModelName(input: string): NormalizedModel {
    const raw = input;
    let s = input.trim().toLowerCase();

    let providerHint: string | undefined;
    let prefixKey: string | undefined;
    for (const prefix of PROVIDER_PREFIXES) {
        if (s.startsWith(prefix)) {
            prefixKey = prefix.slice(0, -1);
            providerHint = PREFIX_TO_PROVIDER[prefixKey];
            s = s.slice(prefix.length);
            break;
        }
    }

    s = s.replace(/[_:\/]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    let dateHint: string | undefined;
    const compactDate = s.match(DATE_TRAILING_COMPACT);
    if (compactDate) {
        dateHint = `${compactDate[1]}-${compactDate[2]}-${compactDate[3]}`;
    } else {
        const hyphenDate = s.match(DATE_TRAILING_HYPHEN);
        if (hyphenDate) {
            dateHint = `${hyphenDate[1]}-${hyphenDate[2]}-${hyphenDate[3]}`;
        }
    }

    let versionHint: string | undefined;
    const versionMatch = s.match(/\b(\d+)-(\d+)\b/);
    if (versionMatch) {
        versionHint = `${versionMatch[1]}.${versionMatch[2]}`;
    } else {
        const dotVersion = s.match(/(\d+\.\d+(?:\.\d+)?)/);
        if (dotVersion) {
            versionHint = dotVersion[1];
        }
    }

    let sizeHint: string | undefined;
    const sizeMatch = s.match(SIZE_PATTERN);
    if (sizeMatch) {
        sizeHint = sizeMatch[1];
    }

    let variantHint: string | undefined;
    let channelHint: string | undefined;
    const variantMatches = [...s.matchAll(VARIANT_PATTERN)];
    if (variantMatches.length > 0) {
        const semantics: string[] = [];
        for (const m of variantMatches) {
            const v = m[1]!;
            if (CHANNEL_MARKERS.includes(v)) {
                channelHint = v;
            } else {
                semantics.push(v);
            }
        }
        if (semantics.length > 0) {
            variantHint = semantics.sort((a, b) => (VARIANT_PRIORITY[b] ?? 0) - (VARIANT_PRIORITY[a] ?? 0))[0];
        }
    }

    let familyHint: string | undefined;
    if (prefixKey) familyHint = PREFIX_TO_FAMILY[prefixKey];
    if (!familyHint) {
        for (const [pattern, family] of FAMILY_PATTERNS) {
            if (pattern.test(s)) {
                familyHint = family;
                break;
            }
        }
    }

    let kindHint: string | undefined;
    for (const [pattern, kind] of KIND_SIGNALS) {
        if (pattern.test(s)) {
            kindHint = kind;
            break;
        }
    }

    const tokens = s.split('-').filter(t => t.length > 0);

    return Object.assign(
        {raw, normalized: s, tokens} as NormalizedModel,
        pickDefined({providerHint, familyHint, versionHint, sizeHint, variantHint, channelHint, dateHint, kindHint}),
    );
}

export function stripDate(normalized: string): string | undefined {
    const compact = normalized.match(DATE_TRAILING_COMPACT);
    if (compact) return normalized.slice(0, -compact[0].length);
    const hyphen = normalized.match(DATE_TRAILING_HYPHEN);
    if (hyphen) return normalized.slice(0, -hyphen[0].length);
    return undefined;
}

const PROVIDER_REVISION = /-0\d{2}$|-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$|-(0[1-9]|1[0-2])-(\d{4})$/;

export function stripProviderRevision(normalized: string): string | undefined {
    const match = normalized.match(PROVIDER_REVISION);
    if (match) return normalized.slice(0, -match[0].length);
    return undefined;
}

const QUANTIZATION = /-(q\d+(-\d+)?|fp16|fp32|int4|int8|gguf)$/;

export function stripQuantization(normalized: string): string | undefined {
    const match = normalized.match(QUANTIZATION);
    if (match) return normalized.slice(0, -match[0].length);
    return undefined;
}

const CHANNEL_SUFFIX = /-(latest|preview)$/;

export function stripChannel(normalized: string): string | undefined {
    const match = normalized.match(CHANNEL_SUFFIX);
    if (match) return normalized.slice(0, -match[0].length);
    return undefined;
}
