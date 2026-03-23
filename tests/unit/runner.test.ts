import {describe, expect, it, vi} from 'vitest';
import type {HoloToolRunnerOptions} from '../../src/client';
import {HoloStream, HoloToolRunner} from '../../src/client';
import type {HoloResponse, HoloStreamEvent} from '@holokai/holo-types/holo';
import {makeBlockingEvents, makeEvents} from './helpers';

function makeStreamFromResponse(response: HoloResponse): HoloStream {
    const events: HoloStreamEvent[] = [
        {
            type: 'response.created',
            response: {id: 'r1', model: response.model, output: [], created: 1, finish_reason: null, usage: {}}
        },
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
            tool_calls: [{
                id: 'tc1',
                type: 'function',
                function: {name: 'get_weather', arguments: {city: 'SF'}},
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

    it('prefers msg.tool_calls over content blocks (no double-counting)', async () => {
        const response: HoloResponse = {
            model: 'gpt-4o',
            output: [{
                role: 'assistant',
                content: [{type: 'tool_call', id: 'tc1', name: 'fn', arguments: {a: 1}}],
                tool_calls: [{id: 'tc1', type: 'function', function: {name: 'fn', arguments: {a: 1}}}],
            }],
            created: Date.now(),
            finish_reason: 'tool_calls',
            usage: {},
        };

        const streamFn = vi.fn()
            .mockResolvedValueOnce(makeStreamFromResponse(response))
            .mockResolvedValueOnce(makeStreamFromResponse(stopResponse('done')));

        const toolHandler = vi.fn().mockResolvedValue({tool_call_id: 'tc1', content: 'ok'});

        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'hi'}],
            tools: [{name: 'fn', parameters: {}}],
            toolHandler,
        };

        const runner = new HoloToolRunner(streamFn, options);
        await runner.finalResponse();
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

        expect(runner.finalResponse()).rejects.toThrow('Runner aborted');
    });

    it('abort during active stream calls stream.abort()', async () => {
        let capturedStream: HoloStream | undefined;
        const {generator: slowEvents, resolve} = makeBlockingEvents();

        const streamFn = vi.fn().mockImplementation(() => {
            const stream = new HoloStream(slowEvents, new AbortController());
            capturedStream = stream;
            vi.spyOn(stream, 'abort');
            return Promise.resolve(stream);
        });

        const options: HoloToolRunnerOptions = {
            messages: [{role: 'user', content: 'hi'}],
            tools: [],
            toolHandler: vi.fn(),
        };

        const runner = new HoloToolRunner(streamFn, options);
        const promise = runner.finalResponse();
        await new Promise((r) => setTimeout(r, 10));
        runner.abort();
        resolve();
        try {
            await promise;
        } catch { /* expected */
        }
        expect(capturedStream).toBeDefined();
        expect(capturedStream!.abort).toHaveBeenCalled();
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
