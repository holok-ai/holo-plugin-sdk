import {describe, it, expect} from 'vitest';
import {HoloStream} from '../../src/client/stream.js';
import {HoloStreamError} from '../../src/client/errors.js';
import type {HoloStreamEvent} from '@holokai/types/holo';

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

function sampleEvents(): HoloStreamEvent[] {
    return [
        {type: 'response.created', response: {id: 'r1', model: 'gpt-4o', output: [], created: 1, finish_reason: null, usage: {}}},
        {type: 'response.output_text.delta', delta: 'Hello'},
        {type: 'response.output_text.delta', delta: ' world'},
        {type: 'response.completed', finish_reason: 'stop'},
    ];
}

describe('HoloStream', () => {
    describe('async iteration', () => {
        it('yields all events', async () => {
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            const collected: HoloStreamEvent[] = [];
            for await (const event of stream) {
                collected.push(event);
            }
            expect(collected).toHaveLength(4);
        });
    });

    describe('double-iterate guard', () => {
        it('throws on second iteration', async () => {
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            for await (const _e of stream) { /* consume */ }
            expect(() => stream[Symbol.asyncIterator]()).toThrow('HoloStream can only be iterated once');
        });
    });

    describe('text()', () => {
        it('returns concatenated text', async () => {
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            const text = await stream.text();
            expect(text).toBe('Hello world');
        });

        it('returns empty string for no text events', async () => {
            const events: HoloStreamEvent[] = [
                {type: 'response.created', response: {id: 'r1', model: 'm', output: [], created: 1, finish_reason: null, usage: {}}},
                {type: 'response.completed', finish_reason: 'stop'},
            ];
            const stream = new HoloStream(makeEvents(events), new AbortController());
            expect(await stream.text()).toBe('');
        });
    });

    describe('iteration after text()', () => {
        it('throws after text() consumed the stream', async () => {
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            await stream.text();
            expect(() => stream[Symbol.asyncIterator]()).toThrow();
        });
    });

    describe('double text()', () => {
        it('second text() short-circuits when completedResponse is set', async () => {
            const evts: HoloStreamEvent[] = [
                {type: 'response.output_text.delta', delta: 'Hello'},
                {
                    type: 'response.completed',
                    finish_reason: 'stop',
                    response: {id: 'r1', model: 'gpt-4o', output: [{role: 'assistant', content: 'Hello'}], created: 1, finish_reason: 'stop', usage: {}},
                },
            ];
            const stream = new HoloStream(makeEvents(evts), new AbortController());
            const first = await stream.text();
            const second = await stream.text();
            expect(first).toBe('Hello');
            expect(second).toBe('Hello');
        });

        it('second text() throws without completedResponse', async () => {
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            await stream.text();
            await expect(stream.text()).rejects.toThrow('HoloStream can only be iterated once');
        });
    });

    describe('on() handlers', () => {
        it('fires text delta handler', async () => {
            const deltas: string[] = [];
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            stream.on('response.output_text.delta', (d) => deltas.push(d));
            await stream.text();
            expect(deltas).toEqual(['Hello', ' world']);
        });

        it('fires completed handler', async () => {
            const completions: unknown[] = [];
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            stream.on('response.completed', (r) => completions.push(r));
            await stream.text();
            expect(completions).toHaveLength(1);
        });

        it('fires failed handler', async () => {
            const errors: Error[] = [];
            const events: HoloStreamEvent[] = [
                {type: 'response.failed', error: {message: 'boom'}},
            ];
            const stream = new HoloStream(makeEvents(events), new AbortController());
            stream.on('response.failed', (e) => errors.push(e));
            // for-await iteration doesn't throw on failed
            for await (const _e of stream) { /* consume */ }
            expect(errors).toHaveLength(1);
            expect(errors[0]!.message).toBe('boom');
        });
    });

    describe('failed-event rejection', () => {
        it('text() throws HoloStreamError on response.failed', async () => {
            const events: HoloStreamEvent[] = [
                {type: 'response.output_text.delta', delta: 'partial'},
                {type: 'response.failed', error: {message: 'upstream timeout'}},
            ];
            const stream = new HoloStream(makeEvents(events), new AbortController());
            await expect(stream.text()).rejects.toThrow(HoloStreamError);
            await expect(stream.text()).rejects.toThrow('upstream timeout');
        });

        it('finalResponse() throws HoloStreamError on response.failed', async () => {
            const events: HoloStreamEvent[] = [
                {type: 'response.failed', error: {message: 'model error'}},
            ];
            const stream = new HoloStream(makeEvents(events), new AbortController());
            await expect(stream.finalResponse()).rejects.toThrow(HoloStreamError);
        });

        it('for-await iteration is unaffected by response.failed', async () => {
            const events: HoloStreamEvent[] = [
                {type: 'response.output_text.delta', delta: 'hi'},
                {type: 'response.failed', error: {message: 'oops'}},
            ];
            const stream = new HoloStream(makeEvents(events), new AbortController());
            const collected: HoloStreamEvent[] = [];
            for await (const event of stream) {
                collected.push(event);
            }
            expect(collected).toHaveLength(2);
        });
    });

    describe('abort()', () => {
        it('aborts the controller', () => {
            const ac = new AbortController();
            const stream = new HoloStream(makeEvents(sampleEvents()), ac);
            stream.abort();
            expect(ac.signal.aborted).toBe(true);
        });
    });

    describe('finalResponse()', () => {
        it('returns accumulated response', async () => {
            const stream = new HoloStream(makeEvents(sampleEvents()), new AbortController());
            const res = await stream.finalResponse();
            expect(res.model).toBe('gpt-4o');
        });
    });
});
