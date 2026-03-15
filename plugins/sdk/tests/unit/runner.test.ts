import {describe, it, expect, vi} from 'vitest';
import {HoloToolRunner} from '../../src/client/runner.js';
import type {HoloToolRunnerOptions} from '../../src/client/runner.js';
import {HoloStream} from '../../src/client/stream.js';
import type {HoloResponse, HoloStreamEvent} from '@holokai/types/holo';

function makeEvents(events: HoloStreamEvent[]) {
    let i = 0;
    return {
        async next() {
            if (i >= events.length) return {done: true as const, value: undefined};
            return {done: false as const, value: events[i++]!};
        },
        async return() { return {done: true as const, value: undefined}; },
        async throw(e: unknown) { throw e; },
        [Symbol.asyncIterator]() { return this; },
    } as AsyncGenerator<HoloStreamEvent>;
}

function makeStreamFromResponse(response: HoloResponse): HoloStream {
    const events: HoloStreamEvent[] = [
        {type: 'response.created', response: {id: 'r1', model: response.model, output: [], created: 1, finish_reason: null, usage: {}}},
    ];

    for (const msg of response.output ?? []) {
        if (typeof msg.content === 'string') {
            events.push({type: 'response.output_text.delta', delta: msg.content});
        }
    }

    const completedEvent: HoloStreamEvent = {
        type: 'response.completed',
        response,
    };
    if (response.finish_reason !== undefined) completedEvent.finish_reason = response.finish_reason;
    if (response.usage !== undefined) completedEvent.usage = response.usage;
    events.push(completedEvent);

    return new HoloStream(makeEvents(events), new AbortController());
}

function stopResponse(text: string): HoloResponse {
    return {
        model: 'gpt-4o',
        output: [{role: 'assistant', content: text}],
        created: Date.now(),
        finish_reason: 'stop',
        usage: {},
    };
}

function toolCallResponse(): HoloResponse {
    return {
        model: 'gpt-4o',
        output: [{
            role: 'assistant',
            content: [{
                type: 'tool_call',
                id: 'tc1',
                name: 'get_weather',
                arguments: {city: 'SF'},
            }],
        }],
        created: Date.now(),
        finish_reason: 'tool_calls',
        usage: {},
    };
}

describe('HoloToolRunner', () => {
    it('returns immediately when finish_reason is stop', async () => {
        const streamFn = vi.fn().mockResolvedValue(makeStreamFromResponse(stopResponse('Hello!')));

        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'hi'}],
            tools: [],
            toolHandler: vi.fn(),
        };

        const runner = new HoloToolRunner(streamFn, options);
        const res = await runner.finalResponse();
        expect(res.finish_reason).toBe('stop');
        expect(streamFn).toHaveBeenCalledOnce();
    });

    it('loops until model stops calling tools', async () => {
        const streamFn = vi.fn()
            .mockResolvedValueOnce(makeStreamFromResponse(toolCallResponse()))
            .mockResolvedValueOnce(makeStreamFromResponse(stopResponse('Weather is sunny')));

        const toolHandler = vi.fn().mockResolvedValue({
            tool_call_id: 'tc1',
            content: '72F and sunny',
        });

        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'weather in SF?'}],
            tools: [{name: 'get_weather', parameters: {}}],
            toolHandler,
        };

        const runner = new HoloToolRunner(streamFn, options);
        const res = await runner.finalResponse();
        expect(res.finish_reason).toBe('stop');
        expect(streamFn).toHaveBeenCalledTimes(2);
        expect(toolHandler).toHaveBeenCalledOnce();
    });

    it('respects maxIterations cap', async () => {
        const streamFn = vi.fn().mockImplementation(() =>
            Promise.resolve(makeStreamFromResponse(toolCallResponse()))
        );

        const toolHandler = vi.fn().mockResolvedValue({
            tool_call_id: 'tc1',
            content: 'result',
        });

        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'loop'}],
            tools: [{name: 'get_weather', parameters: {}}],
            toolHandler,
            maxIterations: 3,
        };

        const runner = new HoloToolRunner(streamFn, options);
        const res = await runner.finalResponse();
        expect(streamFn).toHaveBeenCalledTimes(3);
        expect(res.finish_reason).toBe('tool_calls');
    });

    it('abort before first call throws', async () => {
        const streamFn = vi.fn();
        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'hi'}],
            tools: [],
            toolHandler: vi.fn(),
        };

        const runner = new HoloToolRunner(streamFn, options);
        runner.abort();

        await expect(runner.finalResponse()).rejects.toThrow('Runner aborted');
    });

    it('emits iteration events', async () => {
        const streamFn = vi.fn().mockResolvedValue(makeStreamFromResponse(stopResponse('done')));
        const iterations: unknown[] = [];
        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'hi'}],
            tools: [],
            toolHandler: vi.fn(),
        };

        const runner = new HoloToolRunner(streamFn, options);
        runner.on('iteration', (data) => iterations.push(data));
        await runner.finalResponse();
        expect(iterations).toHaveLength(1);
    });

    it('emits tool_calls and tool_result events', async () => {
        const streamFn = vi.fn()
            .mockResolvedValueOnce(makeStreamFromResponse(toolCallResponse()))
            .mockResolvedValueOnce(makeStreamFromResponse(stopResponse('done')));

        const toolCalls: unknown[] = [];
        const toolResults: unknown[] = [];

        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'hi'}],
            tools: [{name: 'get_weather', parameters: {}}],
            toolHandler: vi.fn().mockResolvedValue({tool_call_id: 'tc1', content: 'result'}),
        };

        const runner = new HoloToolRunner(streamFn, options);
        runner.on('tool_calls', (c) => toolCalls.push(c));
        runner.on('tool_result', (r) => toolResults.push(r));
        await runner.finalResponse();

        expect(toolCalls).toHaveLength(1);
        expect(toolResults).toHaveLength(1);
    });
});
