import {describe, it, expect} from 'vitest';
import {HoloStreamAccumulator} from '../../src/client/merge.js';

describe('HoloStreamAccumulator', () => {
    it('accumulates text deltas', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.output_text.delta', delta: 'Hello'});
        acc.push({type: 'response.output_text.delta', delta: ' world'});
        expect(acc.getText()).toBe('Hello world');
    });

    it('toResponse() produces valid HoloResponse', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.created', response: {id: 'r1', model: 'gpt-4o', created: 100, output: [], finish_reason: null, usage: {}}});
        acc.push({type: 'response.output_text.delta', delta: 'Hi'});
        acc.push({type: 'response.usage', usage: {input_tokens: 5, output_tokens: 1}});
        acc.push({type: 'response.completed', finish_reason: 'stop'});

        const res = acc.toResponse();
        expect(res.id).toBe('r1');
        expect(res.model).toBe('gpt-4o');
        expect(res.output).toHaveLength(1);
        expect(res.output[0]!.content).toBe('Hi');
        expect(res.usage).toEqual({input_tokens: 5, output_tokens: 1});
        expect(res.finish_reason).toBe('stop');
    });

    it('handles response.completed with full response (no-op accumulation)', () => {
        const acc = new HoloStreamAccumulator();
        const fullResponse = {id: 'r1', model: 'gpt-4o', output: [], created: 100, finish_reason: null as null, usage: {}};
        acc.push({type: 'response.completed', response: fullResponse});
        const res = acc.toResponse();
        expect(res.model).toBe('');
    });

    it('accumulates tool call deltas across multiple events', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {id: 'tc1', name: 'get_weather'}});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {arguments_delta: '{"city"'}});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {arguments_delta: ':"SF"}'}});

        const res = acc.toResponse();
        expect(res.output).toHaveLength(0);
    });

    it('handles response.failed', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.failed', error: {message: 'oops'}});
        const res = acc.toResponse();
        expect(res.finish_reason).toBe('error');
    });

    it('getText() returns empty string with no deltas', () => {
        const acc = new HoloStreamAccumulator();
        expect(acc.getText()).toBe('');
    });

    it('ignores pass-through event types', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.content_block.start'});
        acc.push({type: 'response.content_block.delta'});
        acc.push({type: 'response.content_block.stop'});
        acc.push({type: 'response.message.start'});
        acc.push({type: 'response.message.stop'});
        expect(acc.getText()).toBe('');
        expect(acc.toResponse().output).toHaveLength(0);
    });
});
