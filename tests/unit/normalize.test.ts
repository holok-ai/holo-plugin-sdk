import {describe, expect, it} from 'vitest';
import {
    normalizeModelName,
    stripChannel,
    stripDate,
    stripProviderRevision,
    stripQuantization
} from '../../src/matching/normalize';

describe('normalizeModelName', () => {
    describe('basic normalization', () => {
        it('lowercases and trims input', () => {
            const result = normalizeModelName('  Claude Haiku 3 5  ');
            expect(result.normalized).toBe('claude-haiku-3-5');
            expect(result.raw).toBe('  Claude Haiku 3 5  ');
        });

        it('replaces underscores, colons, and slashes with dashes', () => {
            expect(normalizeModelName('llama3.1:8b').normalized).toBe('llama3.1-8b');
            expect(normalizeModelName('some_model_name').normalized).toBe('some-model-name');
        });

        it('collapses whitespace and multiple dashes', () => {
            expect(normalizeModelName('Claude  Haiku  3  5').normalized).toBe('claude-haiku-3-5');
            expect(normalizeModelName('claude--3--haiku').normalized).toBe('claude-3-haiku');
        });

        it('strips leading and trailing dashes', () => {
            expect(normalizeModelName('-claude-3-haiku-').normalized).toBe('claude-3-haiku');
        });
    });

    describe('provider prefix stripping', () => {
        it('strips anthropic/ and sets providerHint to anthropic', () => {
            const r = normalizeModelName('anthropic/claude-3-5-haiku');
            expect(r.providerHint).toBe('anthropic');
            expect(r.normalized).toBe('claude-3-5-haiku');
        });

        it('strips openai/ and sets providerHint to openai', () => {
            const r = normalizeModelName('openai/gpt-4o-mini');
            expect(r.providerHint).toBe('openai');
            expect(r.normalized).toBe('gpt-4o-mini');
        });

        it('strips google/ and sets providerHint to google', () => {
            const r = normalizeModelName('google/gemini-1.5-flash');
            expect(r.providerHint).toBe('google');
            expect(r.normalized).toBe('gemini-1.5-flash');
        });

        it('strips meta-llama/ and sets providerHint to meta', () => {
            const r = normalizeModelName('meta-llama/llama-3.1-8b');
            expect(r.providerHint).toBe('meta');
        });

        it('strips meta/ and sets providerHint to meta', () => {
            const r = normalizeModelName('meta/llama-3.1-8b');
            expect(r.providerHint).toBe('meta');
        });

        it('strips mistralai/ and sets providerHint to mistral', () => {
            const r = normalizeModelName('mistralai/mistral-7b');
            expect(r.providerHint).toBe('mistral');
        });

        it('strips ollama/ and sets providerHint to ollama', () => {
            const r = normalizeModelName('ollama/llama3.1:8b');
            expect(r.providerHint).toBe('ollama');
            expect(r.normalized).toBe('llama3.1-8b');
        });

        it('strips lmstudio/ and sets providerHint to lmstudio', () => {
            const r = normalizeModelName('lmstudio/qwen2.5-coder:7b');
            expect(r.providerHint).toBe('lmstudio');
        });

        it('strips openrouter/ and sets providerHint to openrouter', () => {
            const r = normalizeModelName('openrouter/claude-3-5-haiku');
            expect(r.providerHint).toBe('openrouter');
        });

        it('strips azure/ and sets providerHint to azure', () => {
            const r = normalizeModelName('azure/gpt-4o');
            expect(r.providerHint).toBe('azure');
        });

        it('strips models/ without setting providerHint', () => {
            const r = normalizeModelName('models/gemini-1.5-flash');
            expect(r.providerHint).toBeUndefined();
            expect(r.normalized).toBe('gemini-1.5-flash');
            expect(r.familyHint).toBe('gemini');
        });
    });

    describe('provider vs family separation', () => {
        it('anthropic/ sets provider=anthropic, family=claude', () => {
            const r = normalizeModelName('anthropic/claude-3-5-haiku');
            expect(r.providerHint).toBe('anthropic');
            expect(r.familyHint).toBe('claude');
        });

        it('openai/ sets provider=openai, family from content (gpt)', () => {
            const r = normalizeModelName('openai/gpt-4o-mini');
            expect(r.providerHint).toBe('openai');
            expect(r.familyHint).toBe('gpt');
        });

        it('google/ sets provider=google, family=gemini', () => {
            const r = normalizeModelName('google/gemini-1.5-flash');
            expect(r.providerHint).toBe('google');
            expect(r.familyHint).toBe('gemini');
        });

        it('meta-llama/ sets provider=meta, family=llama', () => {
            const r = normalizeModelName('meta-llama/llama-3.1-8b');
            expect(r.providerHint).toBe('meta');
            expect(r.familyHint).toBe('llama');
        });

        it('ollama/ sets provider=ollama, family from content', () => {
            const r = normalizeModelName('ollama/llama3.1:8b');
            expect(r.providerHint).toBe('ollama');
            expect(r.familyHint).toBe('llama');
        });
    });

    describe('family detection', () => {
        it('claude', () => expect(normalizeModelName('claude-3-5-haiku').familyHint).toBe('claude'));
        it('gemini', () => expect(normalizeModelName('gemini-1.5-flash').familyHint).toBe('gemini'));
        it('gpt', () => expect(normalizeModelName('gpt-4o-mini').familyHint).toBe('gpt'));
        it('o-series from o1', () => expect(normalizeModelName('o1-preview').familyHint).toBe('o-series'));
        it('o-series from o1-mini', () => expect(normalizeModelName('o1-mini').familyHint).toBe('o-series'));
        it('o-series from o3-mini', () => expect(normalizeModelName('o3-mini').familyHint).toBe('o-series'));
        it('o-series from openai/o3-mini', () => {
            const r = normalizeModelName('openai/o3-mini');
            expect(r.providerHint).toBe('openai');
            expect(r.familyHint).toBe('o-series');
        });
        it('llama (dash-separated)', () => expect(normalizeModelName('llama-3-70b-instruct').familyHint).toBe('llama'));
        it('llama (glued to version)', () => expect(normalizeModelName('llama3.1:8b').familyHint).toBe('llama'));
        it('qwen (glued to version)', () => expect(normalizeModelName('qwen2.5-coder:7b').familyHint).toBe('qwen'));
        it('mistral', () => expect(normalizeModelName('mistral-7b-instruct').familyHint).toBe('mistral'));
        it('mixtral → mistral', () => expect(normalizeModelName('mixtral-8x7b').familyHint).toBe('mistral'));
        it('deepseek', () => expect(normalizeModelName('deepseek-coder-v2').familyHint).toBe('deepseek'));
        it('command → cohere', () => expect(normalizeModelName('command-r-plus').familyHint).toBe('cohere'));
        it('phi', () => expect(normalizeModelName('phi-3-mini').familyHint).toBe('phi'));
        it('gemma', () => expect(normalizeModelName('gemma-2-9b').familyHint).toBe('gemma'));
    });

    describe('date detection', () => {
        it('detects compact trailing date YYYYMMDD', () => {
            expect(normalizeModelName('claude-3-5-haiku-20241022').dateHint).toBe('2024-10-22');
        });

        it('detects hyphenated trailing date YYYY-MM-DD', () => {
            expect(normalizeModelName('claude-3-5-haiku-2024-10-22').dateHint).toBe('2024-10-22');
        });

        it('no dateHint when no trailing date', () => {
            expect(normalizeModelName('gpt-4o-mini').dateHint).toBeUndefined();
        });

        it('no dateHint for latest suffix', () => {
            expect(normalizeModelName('claude-3-5-haiku-latest').dateHint).toBeUndefined();
        });
    });

    describe('version detection', () => {
        it('dash-separated: claude-3-5 → 3.5', () => {
            expect(normalizeModelName('claude-3-5-haiku-20241022').versionHint).toBe('3.5');
        });

        it('dash-separated standalone: gemini-1-5 → 1.5', () => {
            expect(normalizeModelName('gemini-1-5-flash').versionHint).toBe('1.5');
        });

        it('dot version with word boundary: llama-3.1 → 3.1', () => {
            expect(normalizeModelName('llama-3.1-8b').versionHint).toBe('3.1');
        });

        it('dot version glued to name: llama3.1 → 3.1', () => {
            expect(normalizeModelName('llama3.1:8b').versionHint).toBe('3.1');
        });

        it('dot version: qwen2.5 → 2.5', () => {
            expect(normalizeModelName('qwen2.5-coder:7b').versionHint).toBe('2.5');
        });

        it('spaced version: "Claude Haiku 3 5" → 3.5', () => {
            expect(normalizeModelName('Claude Haiku 3 5').versionHint).toBe('3.5');
        });

        it('spaced version: "claude 3 5 haiku" → 3.5', () => {
            expect(normalizeModelName('claude 3 5 haiku').versionHint).toBe('3.5');
        });

        it('already-dashed: "claude-haiku-3-5" → 3.5', () => {
            expect(normalizeModelName('claude-haiku-3-5').versionHint).toBe('3.5');
        });

        it('already-dashed: "claude-3-5-haiku" → 3.5', () => {
            expect(normalizeModelName('claude-3-5-haiku').versionHint).toBe('3.5');
        });

        it('dot version: "claude-3.5-haiku" → 3.5', () => {
            expect(normalizeModelName('claude-3.5-haiku').versionHint).toBe('3.5');
        });
    });

    describe('size detection', () => {
        it('8b', () => expect(normalizeModelName('llama3.1:8b').sizeHint).toBe('8b'));
        it('7b', () => expect(normalizeModelName('qwen2.5-coder:7b').sizeHint).toBe('7b'));
        it('70b', () => expect(normalizeModelName('llama-3-70b-instruct').sizeHint).toBe('70b'));
        it('405b', () => expect(normalizeModelName('llama-3-405b').sizeHint).toBe('405b'));
        it('8x7b (MoE)', () => expect(normalizeModelName('mixtral-8x7b-instruct').sizeHint).toBe('8x7b'));
        it('236b', () => expect(normalizeModelName('deepseek-v2-236b').sizeHint).toBe('236b'));
    });

    describe('variant detection (priority-based)', () => {
        it('haiku', () => expect(normalizeModelName('claude-3-5-haiku-20241022').variantHint).toBe('haiku'));
        it('sonnet', () => expect(normalizeModelName('claude-3-5-sonnet-20241022').variantHint).toBe('sonnet'));
        it('opus', () => expect(normalizeModelName('claude-3-opus').variantHint).toBe('opus'));
        it('mini', () => expect(normalizeModelName('gpt-4o-mini').variantHint).toBe('mini'));
        it('flash', () => expect(normalizeModelName('gemini-1.5-flash').variantHint).toBe('flash'));
        it('coder', () => expect(normalizeModelName('qwen2.5-coder:7b').variantHint).toBe('coder'));
        it('instruct', () => expect(normalizeModelName('llama-3-70b-instruct').variantHint).toBe('instruct'));
        it('turbo', () => expect(normalizeModelName('gpt-4-turbo').variantHint).toBe('turbo'));

        it('haiku wins over latest (priority)', () => {
            const r = normalizeModelName('claude-3-5-haiku-latest');
            expect(r.variantHint).toBe('haiku');
            expect(r.channelHint).toBe('latest');
        });

        it('flash wins over preview (priority)', () => {
            const r = normalizeModelName('gemini-2.0-flash-preview');
            expect(r.variantHint).toBe('flash');
            expect(r.channelHint).toBe('preview');
        });

        it('mini wins over preview', () => {
            const r = normalizeModelName('gpt-4o-mini-preview');
            expect(r.variantHint).toBe('mini');
            expect(r.channelHint).toBe('preview');
        });

        it('instruct wins when combined with coder (higher priority)', () => {
            const r = normalizeModelName('qwen2.5-coder-instruct');
            expect(r.variantHint).toBe('instruct');
        });
    });

    describe('channel detection', () => {
        it('latest', () => {
            expect(normalizeModelName('claude-3-5-haiku-latest').channelHint).toBe('latest');
        });

        it('preview', () => {
            expect(normalizeModelName('gemini-2.0-flash-preview').channelHint).toBe('preview');
        });

        it('latest alone sets channelHint, not variantHint', () => {
            const r = normalizeModelName('gpt-4o-latest');
            expect(r.channelHint).toBe('latest');
            expect(r.variantHint).toBeUndefined();
        });

        it('preview alone sets channelHint, not variantHint', () => {
            const r = normalizeModelName('o1-preview');
            expect(r.channelHint).toBe('preview');
            expect(r.variantHint).toBeUndefined();
        });

        it('no channelHint when absent', () => {
            expect(normalizeModelName('claude-3-5-haiku-20241022').channelHint).toBeUndefined();
        });
    });

    describe('kind detection', () => {
        it('embedding', () => expect(normalizeModelName('text-embedding-3-small').kindHint).toBe('embedding'));
        it('tts', () => expect(normalizeModelName('tts-1-hd').kindHint).toBe('tts'));
        it('transcription (whisper)', () => expect(normalizeModelName('whisper-1').kindHint).toBe('transcription'));
        it('moderation', () => expect(normalizeModelName('text-moderation-latest').kindHint).toBe('moderation'));
        it('image (dall-e)', () => expect(normalizeModelName('dall-e-3').kindHint).toBe('image'));
        it('rerank', () => expect(normalizeModelName('rerank-english-v3').kindHint).toBe('rerank'));
    });

    describe('tokens', () => {
        it('splits by dash', () => {
            expect(normalizeModelName('claude-3-5-haiku-20241022').tokens).toEqual(['claude', '3', '5', 'haiku', '20241022']);
        });

        it('preserves dot-joined segments', () => {
            expect(normalizeModelName('llama3.1:8b').tokens).toEqual(['llama3.1', '8b']);
        });
    });

    describe('spec integration cases', () => {
        it('claude-3-5-haiku-20241022', () => {
            const r = normalizeModelName('claude-3-5-haiku-20241022');
            expect(r.normalized).toBe('claude-3-5-haiku-20241022');
            expect(r.dateHint).toBe('2024-10-22');
            expect(r.familyHint).toBe('claude');
            expect(r.variantHint).toBe('haiku');
            expect(r.versionHint).toBe('3.5');
            expect(r.providerHint).toBeUndefined();
        });

        it('Claude Haiku 3 5', () => {
            const r = normalizeModelName('Claude Haiku 3 5');
            expect(r.normalized).toBe('claude-haiku-3-5');
            expect(r.familyHint).toBe('claude');
            expect(r.variantHint).toBe('haiku');
            expect(r.versionHint).toBe('3.5');
        });

        it('anthropic/claude-3-5-haiku-latest', () => {
            const r = normalizeModelName('anthropic/claude-3-5-haiku-latest');
            expect(r.providerHint).toBe('anthropic');
            expect(r.familyHint).toBe('claude');
            expect(r.versionHint).toBe('3.5');
            expect(r.variantHint).toBe('haiku');
            expect(r.channelHint).toBe('latest');
        });

        it('gpt-4o-mini', () => {
            const r = normalizeModelName('gpt-4o-mini');
            expect(r.familyHint).toBe('gpt');
            expect(r.variantHint).toBe('mini');
        });

        it('openai/gpt-4o-mini', () => {
            const r = normalizeModelName('openai/gpt-4o-mini');
            expect(r.providerHint).toBe('openai');
            expect(r.familyHint).toBe('gpt');
        });

        it('llama3.1:8b', () => {
            const r = normalizeModelName('llama3.1:8b');
            expect(r.normalized).toBe('llama3.1-8b');
            expect(r.sizeHint).toBe('8b');
            expect(r.familyHint).toBe('llama');
            expect(r.versionHint).toBe('3.1');
        });

        it('qwen2.5-coder:7b', () => {
            const r = normalizeModelName('qwen2.5-coder:7b');
            expect(r.sizeHint).toBe('7b');
            expect(r.variantHint).toBe('coder');
            expect(r.familyHint).toBe('qwen');
            expect(r.versionHint).toBe('2.5');
        });

        it('models/gemini-1.5-flash', () => {
            const r = normalizeModelName('models/gemini-1.5-flash');
            expect(r.normalized).toBe('gemini-1.5-flash');
            expect(r.providerHint).toBeUndefined();
            expect(r.familyHint).toBe('gemini');
            expect(r.variantHint).toBe('flash');
        });

        it('o1-preview', () => {
            const r = normalizeModelName('o1-preview');
            expect(r.familyHint).toBe('o-series');
            expect(r.channelHint).toBe('preview');
            expect(r.variantHint).toBeUndefined();
        });

        it('mixtral-8x7b-instruct', () => {
            const r = normalizeModelName('mixtral-8x7b-instruct');
            expect(r.sizeHint).toBe('8x7b');
            expect(r.variantHint).toBe('instruct');
            expect(r.familyHint).toBe('mistral');
        });

        it('models/gemini-1.5-pro: prefix stripped, no provider, family detected', () => {
            const r = normalizeModelName('models/gemini-1.5-pro');
            expect(r.normalized).toBe('gemini-1.5-pro');
            expect(r.providerHint).toBeUndefined();
            expect(r.familyHint).toBe('gemini');
            expect(r.variantHint).toBe('pro');
            expect(r.versionHint).toBe('1.5');
        });
    });

    describe('OSS/runtime coverage', () => {
        it('llama3.1:8b (bare)', () => {
            const r = normalizeModelName('llama3.1:8b');
            expect(r.normalized).toBe('llama3.1-8b');
            expect(r.familyHint).toBe('llama');
            expect(r.versionHint).toBe('3.1');
            expect(r.sizeHint).toBe('8b');
            expect(r.providerHint).toBeUndefined();
        });

        it('qwen2.5-coder:7b (bare)', () => {
            const r = normalizeModelName('qwen2.5-coder:7b');
            expect(r.normalized).toBe('qwen2.5-coder-7b');
            expect(r.familyHint).toBe('qwen');
            expect(r.versionHint).toBe('2.5');
            expect(r.sizeHint).toBe('7b');
            expect(r.variantHint).toBe('coder');
            expect(r.providerHint).toBeUndefined();
        });

        it('ollama/llama3.1:8b', () => {
            const r = normalizeModelName('ollama/llama3.1:8b');
            expect(r.normalized).toBe('llama3.1-8b');
            expect(r.providerHint).toBe('ollama');
            expect(r.familyHint).toBe('llama');
            expect(r.versionHint).toBe('3.1');
            expect(r.sizeHint).toBe('8b');
        });

        it('lmstudio/qwen2.5-coder:7b', () => {
            const r = normalizeModelName('lmstudio/qwen2.5-coder:7b');
            expect(r.normalized).toBe('qwen2.5-coder-7b');
            expect(r.providerHint).toBe('lmstudio');
            expect(r.familyHint).toBe('qwen');
            expect(r.versionHint).toBe('2.5');
            expect(r.sizeHint).toBe('7b');
            expect(r.variantHint).toBe('coder');
        });
    });

    describe('channel separation coverage', () => {
        it('claude-3-5-haiku-latest: variant=haiku, channel=latest', () => {
            const r = normalizeModelName('claude-3-5-haiku-latest');
            expect(r.variantHint).toBe('haiku');
            expect(r.channelHint).toBe('latest');
            expect(r.dateHint).toBeUndefined();
        });

        it('gemini-2.0-flash-preview: variant=flash, channel=preview', () => {
            const r = normalizeModelName('gemini-2.0-flash-preview');
            expect(r.variantHint).toBe('flash');
            expect(r.channelHint).toBe('preview');
        });

        it('gpt-4o-mini-preview: variant=mini, channel=preview', () => {
            const r = normalizeModelName('gpt-4o-mini-preview');
            expect(r.variantHint).toBe('mini');
            expect(r.channelHint).toBe('preview');
        });
    });
});

describe('stripDate', () => {
    it('strips compact YYYYMMDD', () => {
        expect(stripDate('claude-3-5-haiku-20241022')).toBe('claude-3-5-haiku');
    });

    it('strips hyphenated YYYY-MM-DD', () => {
        expect(stripDate('claude-3-5-haiku-2024-10-22')).toBe('claude-3-5-haiku');
    });

    it('returns undefined when no trailing date', () => {
        expect(stripDate('gpt-4o-mini')).toBeUndefined();
    });

    it('returns undefined for latest suffix', () => {
        expect(stripDate('claude-3-5-haiku-latest')).toBeUndefined();
    });

    it('strips date from minimal model', () => {
        expect(stripDate('model-20230615')).toBe('model');
    });

    it('returns undefined for preview suffix', () => {
        expect(stripDate('gemini-2.0-flash-preview')).toBeUndefined();
    });

    it('only strips trailing dates, not mid-string', () => {
        expect(stripDate('20241022-model')).toBeUndefined();
    });

    it('does not strip partial date-like segments', () => {
        expect(stripDate('claude-2024-haiku')).toBeUndefined();
    });
});

describe('stripProviderRevision', () => {
    it('strips -001 suffix', () => {
        expect(stripProviderRevision('gemini-2.0-flash-001')).toBe('gemini-2.0-flash');
    });

    it('strips -002 suffix', () => {
        expect(stripProviderRevision('gemini-1.5-pro-002')).toBe('gemini-1.5-pro');
    });

    it('strips -05-06 MM-DD revision suffix', () => {
        expect(stripProviderRevision('gemini-2.5-pro-preview-05-06')).toBe('gemini-2.5-pro-preview');
    });

    it('strips -03-25 MM-DD revision suffix', () => {
        expect(stripProviderRevision('gemini-2.5-flash-preview-03-25')).toBe('gemini-2.5-flash-preview');
    });

    it('returns undefined when no revision suffix', () => {
        expect(stripProviderRevision('gpt-4o-mini')).toBeUndefined();
    });

    it('returns undefined for semantic version-like trailing numbers', () => {
        expect(stripProviderRevision('deepseek-v2')).toBeUndefined();
    });

    it('does not strip full dates (those are handled by stripDate)', () => {
        expect(stripProviderRevision('claude-3-5-haiku-20241022')).toBeUndefined();
    });

    it('does not strip size-like suffixes', () => {
        expect(stripProviderRevision('llama-3.1-8b')).toBeUndefined();
    });

    it('strips MM-YYYY revision: preview-10-2025', () => {
        expect(stripProviderRevision('gemini-2.5-computer-use-preview-10-2025')).toBe('gemini-2.5-computer-use-preview');
    });

    it('strips MM-YYYY revision: preview-12-2025', () => {
        expect(stripProviderRevision('deep-research-pro-preview-12-2025')).toBe('deep-research-pro-preview');
    });

    it('strips MM-YYYY revision: preview-09-2025', () => {
        expect(stripProviderRevision('some-model-preview-09-2025')).toBe('some-model-preview');
    });

    it('does not strip real model versions like gpt-4.1-mini', () => {
        expect(stripProviderRevision('gpt-4.1-mini')).toBeUndefined();
    });
});

describe('stripQuantization', () => {
    it('strips -q4-0', () => {
        expect(stripQuantization('llama3.3-70b-instruct-q4-0')).toBe('llama3.3-70b-instruct');
    });

    it('strips -q8-0', () => {
        expect(stripQuantization('mistral-small-24b-instruct-2501-q8-0')).toBe('mistral-small-24b-instruct-2501');
    });

    it('strips -fp16', () => {
        expect(stripQuantization('some-model-fp16')).toBe('some-model');
    });

    it('strips -fp32', () => {
        expect(stripQuantization('some-model-fp32')).toBe('some-model');
    });

    it('strips -int4', () => {
        expect(stripQuantization('some-model-int4')).toBe('some-model');
    });

    it('strips -int8', () => {
        expect(stripQuantization('some-model-int8')).toBe('some-model');
    });

    it('strips -gguf', () => {
        expect(stripQuantization('some-model-gguf')).toBe('some-model');
    });

    it('strips -q4 without sub-level', () => {
        expect(stripQuantization('some-model-q4')).toBe('some-model');
    });

    it('returns undefined on non-quant suffixes', () => {
        expect(stripQuantization('gpt-4o-mini')).toBeUndefined();
    });

    it('returns undefined when no trailing quantization', () => {
        expect(stripQuantization('claude-3-5-haiku')).toBeUndefined();
    });
});

describe('stripChannel', () => {
    it('strips -latest', () => {
        expect(stripChannel('omni-moderation-latest')).toBe('omni-moderation');
    });

    it('strips -preview', () => {
        expect(stripChannel('gpt-4o-realtime-preview')).toBe('gpt-4o-realtime');
    });

    it('returns undefined when no trailing channel', () => {
        expect(stripChannel('gpt-4o-mini')).toBeUndefined();
    });

    it('returns undefined for non-channel suffix', () => {
        expect(stripChannel('claude-3-5-haiku-20241022')).toBeUndefined();
    });
});
