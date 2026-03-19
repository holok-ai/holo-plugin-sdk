import {describe, expect, it, vi} from 'vitest';
import {HoloRequestBuilder} from '../../src/client/builder.js';
import type {HoloRequest, HoloResponse} from '@holokai/types/holo';

const noopSend = vi.fn<(r: HoloRequest) => Promise<HoloResponse>>();
const noopStream = vi.fn();

function builder(defaults?: { model?: string; application?: string }) {
    return new HoloRequestBuilder(noopSend, noopStream as any, defaults);
}

describe('HoloRequestBuilder', () => {
    describe('chaining', () => {
        it('every setter returns this', () => {
            const b = builder({model: 'm'});
            expect(b.model('m')).toBe(b);
            expect(b.user('hi')).toBe(b);
            expect(b.system('sys')).toBe(b);
            expect(b.assistant('a')).toBe(b);
            expect(b.temperature(0.5)).toBe(b);
            expect(b.maxTokens(100)).toBe(b);
            expect(b.topP(0.9)).toBe(b);
            expect(b.topK(40)).toBe(b);
            expect(b.frequencyPenalty(0.1)).toBe(b);
            expect(b.presencePenalty(0.2)).toBe(b);
            expect(b.seed(42)).toBe(b);
            expect(b.stopSequences(['stop'])).toBe(b);
            expect(b.tools([])).toBe(b);
            expect(b.toolChoice({type: 'auto'})).toBe(b);
            expect(b.responseFormat({type: 'text'})).toBe(b);
            expect(b.metadata({user_id: 'u1'})).toBe(b);
            expect(b.serviceTier('auto')).toBe(b);
            expect(b.provider('p')).toBe(b);
            expect(b.threadId('t')).toBe(b);
            expect(b.branch('b')).toBe(b);
        });
    });

    describe('build()', () => {
        it('throws when no model is set', () => {
            expect(() => builder().user('hello').build()).toThrow('No model specified');
        });

        it('inherits model and application from defaults', () => {
            const req = builder({model: 'gpt-4o', application: 'my-app'}).user('hi').build();
            expect(req.model).toBe('gpt-4o');
            expect(req.application).toBe('my-app');
        });

        it('explicit model overrides default', () => {
            const req = builder({model: 'gpt-4o'}).model('claude-3').user('hi').build();
            expect(req.model).toBe('claude-3');
        });

        it('includes all optional fields when set', () => {
            const req = builder()
                .model('m')
                .system('sys')
                .user('hello')
                .temperature(0.7)
                .maxTokens(200)
                .topP(0.9)
                .topK(40)
                .frequencyPenalty(0.1)
                .presencePenalty(0.2)
                .seed(42)
                .stopSequences(['END'])
                .provider('openai')
                .threadId('t-123')
                .branch('main')
                .metadata({user_id: 'u1'})
                .serviceTier('auto')
                .build();

            expect(req.temperature).toBe(0.7);
            expect(req.max_tokens).toBe(200);
            expect(req.top_p).toBe(0.9);
            expect(req.top_k).toBe(40);
            expect(req.frequency_penalty).toBe(0.1);
            expect(req.presence_penalty).toBe(0.2);
            expect(req.seed).toBe(42);
            expect(req.stop_sequences).toEqual(['END']);
            expect(req.provider).toBe('openai');
            expect(req.thread_id).toBe('t-123');
            expect(req.branch).toBe('main');
            expect(req.metadata).toEqual({user_id: 'u1'});
            expect(req.service_tier).toBe('auto');
        });

        it('omits optional fields when not set', () => {
            const req = builder({model: 'm'}).user('hi').build();
            expect(req).not.toHaveProperty('temperature');
            expect(req).not.toHaveProperty('max_tokens');
            expect(req).not.toHaveProperty('tools');
            expect(req).not.toHaveProperty('tool_choice');
            expect(req).not.toHaveProperty('response_format');
            expect(req).not.toHaveProperty('provider');
            expect(req).not.toHaveProperty('thread_id');
            expect(req).not.toHaveProperty('branch');
            expect(req).not.toHaveProperty('metadata');
            expect(req).not.toHaveProperty('service_tier');
        });
    });

    describe('metadata()', () => {
        it('sets metadata with user_id', () => {
            const req = builder({model: 'm'}).user('hi').metadata({user_id: 'u1'}).build();
            expect(req.metadata).toEqual({user_id: 'u1'});
        });

        it('sets metadata to null', () => {
            const req = builder({model: 'm'}).user('hi').metadata(null).build();
            expect(req.metadata).toBeNull();
        });
    });

    describe('response_format helpers', () => {
        it('json() sets json_object format', () => {
            const req = builder({model: 'm'}).user('hi').json().build();
            expect(req.response_format).toEqual({type: 'json_object'});
        });

        it('jsonSchema() sets json_schema format with strict', () => {
            const schema = {type: 'object', properties: {name: {type: 'string'}}};
            const req = builder({model: 'm'}).user('hi').jsonSchema(schema).build();
            expect(req.response_format).toEqual({type: 'json_schema', schema, strict: true});
        });
    });

    describe('tool_choice', () => {
        it('sets tool_choice auto', () => {
            const req = builder({model: 'm'}).user('hi').toolChoice({type: 'auto'}).build();
            expect(req.tool_choice).toEqual({type: 'auto'});
        });

        it('sets tool_choice none', () => {
            const req = builder({model: 'm'}).user('hi').toolChoice({type: 'none'}).build();
            expect(req.tool_choice).toEqual({type: 'none'});
        });
    });

    describe('send()', () => {
        it('calls sendFn with built request', async () => {
            const mockResponse = {
                model: 'gpt-4o',
                output: [],
                created: 1,
                finish_reason: null,
                usage: {}
            } as HoloResponse;
            const sendFn = vi.fn().mockResolvedValue(mockResponse);
            const b = new HoloRequestBuilder(sendFn, noopStream as any, {model: 'gpt-4o'});
            const result = await b.user('hello').send();
            expect(sendFn).toHaveBeenCalledOnce();
            expect(result).toBe(mockResponse);
        });
    });

    describe('stream()', () => {
        it('calls streamFn with stream=true', async () => {
            const mockStream = {};
            const streamFn = vi.fn().mockResolvedValue(mockStream);
            const b = new HoloRequestBuilder(noopSend, streamFn as any, {model: 'gpt-4o'});
            const result = await b.user('hello').stream();
            expect(streamFn).toHaveBeenCalledOnce();
            const passedReq = streamFn.mock.calls[0]![0] as HoloRequest;
            expect(passedReq.stream).toBe(true);
            expect(result).toBe(mockStream);
        });
    });
});
