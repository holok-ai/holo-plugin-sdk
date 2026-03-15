import {describe, it, expect} from 'vitest';
import {HoloStreamAccumulator} from '../../src/client/merge.js';
import type {HoloContentToolCall, HoloContentReasoning, HoloContentText, HoloContent} from '@holokai/types/holo';

describe('HoloStreamAccumulator', () => {
    it('accumulates text deltas', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.output_text.delta', delta: 'Hello'});
        acc.push({type: 'response.output_text.delta', delta: ' world'});
        expect(acc.getText()).toBe('Hello world');
    });

    it('toResponse() produces valid HoloResponse with text shorthand', () => {
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

    it('accumulates tool call deltas and includes them in output', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {id: 'tc1', name: 'get_weather'}});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {arguments_delta: '{"city"'}});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {arguments_delta: ':"SF"}'}});

        const res = acc.toResponse();
        expect(res.output).toHaveLength(1);

        const msg = res.output[0]!;
        expect(Array.isArray(msg.content)).toBe(true);
        const content = msg.content as HoloContent[];
        expect(content).toHaveLength(1);

        const tcBlock = content[0] as HoloContentToolCall;
        expect(tcBlock.type).toBe('tool_call');
        expect(tcBlock.name).toBe('get_weather');
        expect(tcBlock.id).toBe('tc1');
        expect(tcBlock.arguments).toEqual({city: 'SF'});

        expect(msg.tool_calls).toHaveLength(1);
        expect(msg.tool_calls![0]!.function.name).toBe('get_weather');
        expect(msg.tool_calls![0]!.function.arguments).toEqual({city: 'SF'});
    });

    it('reconstructs reasoning in output', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.reasoning.delta', delta: 'Let me '});
        acc.push({type: 'response.reasoning.delta', delta: 'think...'});
        acc.push({type: 'response.output_text.delta', delta: 'Answer'});

        const res = acc.toResponse();
        expect(res.output).toHaveLength(1);

        const msg = res.output[0]!;
        const content = msg.content as HoloContent[];
        expect(content).toHaveLength(2);

        const reasoning = content[0] as HoloContentReasoning;
        expect(reasoning.type).toBe('reasoning');
        expect(reasoning.text).toBe('Let me think...');

        const text = content[1] as HoloContentText;
        expect(text.type).toBe('text');
        expect(text.text).toBe('Answer');
    });

    it('reconstructs mixed content: reasoning + text + tool_calls', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.reasoning.delta', delta: 'thinking'});
        acc.push({type: 'response.output_text.delta', delta: 'response'});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {id: 'tc1', name: 'fn'}});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {arguments_delta: '{}'}});

        const res = acc.toResponse();
        const msg = res.output[0]!;
        const content = msg.content as HoloContent[];
        expect(content).toHaveLength(3);
        expect((content[0] as HoloContentReasoning).type).toBe('reasoning');
        expect((content[1] as HoloContentText).type).toBe('text');
        expect((content[2] as HoloContentToolCall).type).toBe('tool_call');
        expect(msg.tool_calls).toHaveLength(1);
    });

    it('handles malformed tool-call arguments', () => {
        const acc = new HoloStreamAccumulator();
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {id: 'tc1', name: 'fn'}});
        acc.push({type: 'response.tool_call.delta', index: 0, tool_call_delta: {arguments_delta: '{invalid json'}});

        const res = acc.toResponse();
        const msg = res.output[0]!;
        const content = msg.content as HoloContent[];
        const tcBlock = content[0] as HoloContentToolCall;
        expect(tcBlock.raw_arguments).toBe('{invalid json');
        expect(tcBlock.arguments).toEqual({});
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
