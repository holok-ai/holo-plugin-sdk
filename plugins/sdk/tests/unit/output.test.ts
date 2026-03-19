import {describe, expect, it} from 'vitest';
import {
    getMessageInvalidToolCalls,
    getMessageReasoning,
    getMessageText,
    getMessageToolCalls,
    HoloOutput,
} from '../../src/client/output.js';
import type {HoloMessage, HoloResponse} from '@holokai/types/holo';

describe('getMessageText', () => {
    it('returns string content directly', () => {
        const msg: HoloMessage = {role: 'assistant', content: 'Hello'};
        expect(getMessageText(msg)).toBe('Hello');
    });

    it('concatenates text blocks from HoloContent[]', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [
                {type: 'text', text: 'Hello'},
                {type: 'reasoning', text: 'thinking'},
                {type: 'text', text: ' world'},
            ],
        };
        expect(getMessageText(msg)).toBe('Hello world');
    });

    it('returns empty string for empty content array', () => {
        const msg: HoloMessage = {role: 'assistant', content: []};
        expect(getMessageText(msg)).toBe('');
    });

    it('returns empty string for empty string content', () => {
        const msg: HoloMessage = {role: 'assistant', content: ''};
        expect(getMessageText(msg)).toBe('');
    });
});

describe('getMessageReasoning', () => {
    it('returns concatenated reasoning text', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [
                {type: 'reasoning', text: 'Let me '},
                {type: 'text', text: 'Answer'},
                {type: 'reasoning', text: 'think more'},
            ],
        };
        expect(getMessageReasoning(msg)).toBe('Let me think more');
    });

    it('returns empty string for string content', () => {
        const msg: HoloMessage = {role: 'assistant', content: 'Hello'};
        expect(getMessageReasoning(msg)).toBe('');
    });

    it('handles reasoning blocks with optional text', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [{type: 'reasoning', summary: 'redacted'}],
        };
        expect(getMessageReasoning(msg)).toBe('');
    });
});

describe('getMessageToolCalls', () => {
    it('prefers tool_calls projection when present', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [{type: 'tool_call', id: 'tc1', name: 'fn', arguments: {a: 1}}],
            tool_calls: [{id: 'tc1', type: 'function', function: {name: 'fn', arguments: {a: 1}}}],
        };
        const result = getMessageToolCalls(msg);
        expect(result).toHaveLength(1);
        expect(result[0]!.type).toBe('function');
        expect(result[0]!.function.name).toBe('fn');
    });

    it('falls back to content blocks when tool_calls is absent', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [{type: 'tool_call', id: 'tc1', name: 'fn', arguments: {a: 1}}],
        };
        const result = getMessageToolCalls(msg);
        expect(result).toHaveLength(1);
        expect(result[0]!.type).toBe('function');
        expect(result[0]!.function.name).toBe('fn');
        expect(result[0]!.id).toBe('tc1');
    });

    it('falls back to content blocks when tool_calls is empty', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [{type: 'tool_call', name: 'fn', arguments: {}}],
            tool_calls: [],
        };
        const result = getMessageToolCalls(msg);
        expect(result).toHaveLength(1);
        expect(result[0]!.function.name).toBe('fn');
        expect(result[0]!.id).toBeUndefined();
    });

    it('returns empty for string content', () => {
        const msg: HoloMessage = {role: 'assistant', content: 'just text'};
        expect(getMessageToolCalls(msg)).toEqual([]);
    });

    it('does not double-count: uses tool_calls only when both present', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [
                {type: 'tool_call', id: 'tc1', name: 'fn', arguments: {a: 1}},
                {type: 'tool_call', id: 'tc2', name: 'fn2', arguments: {b: 2}},
            ],
            tool_calls: [{id: 'tc1', type: 'function', function: {name: 'fn', arguments: {a: 1}}}],
        };
        const result = getMessageToolCalls(msg);
        expect(result).toHaveLength(1);
    });
});

describe('getMessageInvalidToolCalls', () => {
    it('returns invalid_tool_calls when present', () => {
        const msg: HoloMessage = {
            role: 'assistant',
            content: [],
            invalid_tool_calls: [{error: 'bad json', raw_arguments: '{bad', id: 'tc1', name: 'fn'}],
        };
        expect(getMessageInvalidToolCalls(msg)).toHaveLength(1);
        expect(getMessageInvalidToolCalls(msg)[0]!.error).toBe('bad json');
    });

    it('returns empty array when absent', () => {
        const msg: HoloMessage = {role: 'assistant', content: 'text'};
        expect(getMessageInvalidToolCalls(msg)).toEqual([]);
    });
});

describe('HoloOutput', () => {
    const makeResponse = (output: HoloMessage[]): HoloResponse => ({
        model: 'gpt-4o', output, created: 1, finish_reason: 'stop', usage: {},
    });

    describe('text()', () => {
        it('joins text from multiple assistant messages', () => {
            const res = makeResponse([
                {role: 'assistant', content: 'Hello'},
                {role: 'assistant', content: ' world'},
            ]);
            expect(HoloOutput.text(res)).toBe('Hello world');
        });

        it('ignores non-assistant messages', () => {
            const res = makeResponse([
                {role: 'user', content: 'question'},
                {role: 'assistant', content: 'answer'},
            ]);
            expect(HoloOutput.text(res)).toBe('answer');
        });

        it('handles content block arrays', () => {
            const res = makeResponse([{
                role: 'assistant',
                content: [{type: 'reasoning', text: 'think'}, {type: 'text', text: 'output'}],
            }]);
            expect(HoloOutput.text(res)).toBe('output');
        });
    });

    describe('reasoning()', () => {
        it('joins reasoning from multiple messages', () => {
            const res = makeResponse([
                {role: 'assistant', content: [{type: 'reasoning', text: 'step 1'}, {type: 'text', text: 'a'}]},
                {role: 'assistant', content: [{type: 'reasoning', text: 'step 2'}, {type: 'text', text: 'b'}]},
            ]);
            expect(HoloOutput.reasoning(res)).toBe('step 1step 2');
        });
    });

    describe('toolCalls()', () => {
        it('collects tool calls across messages', () => {
            const res = makeResponse([
                {
                    role: 'assistant',
                    content: [{type: 'tool_call', id: 'tc1', name: 'fn1', arguments: {}}],
                    tool_calls: [{id: 'tc1', type: 'function', function: {name: 'fn1', arguments: {}}}],
                },
                {
                    role: 'assistant',
                    content: [{type: 'tool_call', id: 'tc2', name: 'fn2', arguments: {}}],
                    tool_calls: [{id: 'tc2', type: 'function', function: {name: 'fn2', arguments: {}}}],
                },
            ]);
            expect(HoloOutput.toolCalls(res)).toHaveLength(2);
        });
    });

    describe('invalidToolCalls()', () => {
        it('collects invalid tool calls across messages', () => {
            const res = makeResponse([
                {
                    role: 'assistant',
                    content: [],
                    invalid_tool_calls: [{error: 'bad', raw_arguments: '{x'}],
                },
            ]);
            expect(HoloOutput.invalidToolCalls(res)).toHaveLength(1);
        });

        it('returns empty when no invalids', () => {
            const res = makeResponse([{role: 'assistant', content: 'text'}]);
            expect(HoloOutput.invalidToolCalls(res)).toEqual([]);
        });
    });

    describe('lastMessage()', () => {
        it('returns last message', () => {
            const res = makeResponse([
                {role: 'assistant', content: 'first'},
                {role: 'assistant', content: 'second'},
            ]);
            expect(HoloOutput.lastMessage(res)?.content).toBe('second');
        });

        it('returns undefined on empty output', () => {
            const res = makeResponse([]);
            expect(HoloOutput.lastMessage(res)).toBeUndefined();
        });
    });

    describe('malformed content blocks', () => {
        it('malformed content block args appear in invalidToolCalls not toolCalls', () => {
            const res = makeResponse([{
                role: 'assistant',
                content: [{type: 'tool_call', id: 'tc1', name: 'fn', arguments: {}, raw_arguments: '{bad'}],
                invalid_tool_calls: [{error: 'parse error', raw_arguments: '{bad', id: 'tc1', name: 'fn'}],
                tool_calls: [],
            }]);
            expect(HoloOutput.invalidToolCalls(res)).toHaveLength(1);
            const calls = HoloOutput.toolCalls(res);
            expect(calls).toHaveLength(1);
        });
    });
});
