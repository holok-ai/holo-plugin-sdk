import {describe, expect, it, vi} from 'vitest';
import {HoloClient} from '../../src/client/client.js';
import type {HoloResponse} from '@holokai/holo-types/holo';

const mockResponse: HoloResponse = {
    model: 'gpt-4o',
    output: [{role: 'assistant', content: 'Hello!'}],
    created: Date.now(),
    finish_reason: 'stop',
    usage: {},
};

function createClient() {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
    }));
    const client = new HoloClient({
        baseUrl: 'http://localhost',
        token: 'tok',
        defaultModel: 'gpt-4o',
        defaultApplication: 'test-app',
        fetch: fetchFn,
    });
    return {client, fetchFn};
}

describe('ChatNamespace', () => {
    describe('create()', () => {
        it('sends non-streaming request', async () => {
            const {client, fetchFn} = createClient();
            const result = await client.chat.create({messages: [{role: 'user', content: 'hi'}]});
            expect(result).toEqual(mockResponse);

            const body = JSON.parse(fetchFn.mock.calls[0]![1].body);
            expect(body.stream).toBe(false);
            expect(body.model).toBe('gpt-4o');
            expect(body.application).toBe('test-app');
        });

        it('uses explicit model over default', async () => {
            const {client, fetchFn} = createClient();
            await client.chat.create({model: 'claude-3', messages: [{role: 'user', content: 'hi'}]});
            const body = JSON.parse(fetchFn.mock.calls[0]![1].body);
            expect(body.model).toBe('claude-3');
        });

        it('throws when no model specified and no default', async () => {
            const fetchFn = vi.fn();
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'tok', fetch: fetchFn});
            await expect(client.chat.create({messages: [{role: 'user', content: 'hi'}]}))
                .rejects.toThrow('No model specified');
        });

        it('passes new HoloChatParams fields through', async () => {
            const {client, fetchFn} = createClient();
            await client.chat.create({
                messages: [{role: 'user', content: 'hi'}],
                top_p: 0.9,
                top_k: 40,
                frequency_penalty: 0.1,
                presence_penalty: 0.2,
                seed: 42,
                stop_sequences: ['END'],
                metadata: {user_id: 'u1'},
                service_tier: 'auto',
            });
            const body = JSON.parse(fetchFn.mock.calls[0]![1].body);
            expect(body.top_p).toBe(0.9);
            expect(body.top_k).toBe(40);
            expect(body.frequency_penalty).toBe(0.1);
            expect(body.presence_penalty).toBe(0.2);
            expect(body.seed).toBe(42);
            expect(body.stop_sequences).toEqual(['END']);
            expect(body.metadata).toEqual({user_id: 'u1'});
            expect(body.service_tier).toBe('auto');
        });
    });

    describe('proxy methods', () => {
        it('user() creates builder with user message', () => {
            const {client} = createClient();
            const b = client.chat.user('hello');
            const req = b.build();
            expect(req.messages).toEqual([{role: 'user', content: 'hello'}]);
        });

        it('system() creates builder with system message', () => {
            const {client} = createClient();
            const b = client.chat.system('be helpful');
            const req = b.build();
            expect(req.messages).toEqual([{role: 'system', content: 'be helpful'}]);
        });

        it('model() creates builder with model set', () => {
            const {client} = createClient();
            const b = client.chat.model('claude-3');
            const req = b.user('hi').build();
            expect(req.model).toBe('claude-3');
        });

        it('messages() creates builder with messages array', () => {
            const {client} = createClient();
            const msgs = [{role: 'user' as const, content: 'hi'}, {role: 'assistant' as const, content: 'hello'}];
            const b = client.chat.messages(msgs);
            const req = b.build();
            expect(req.messages).toEqual(msgs);
        });
    });

    describe('system convenience vs explicit parity', () => {
        it('builder().system() matches direct system message', () => {
            const {client} = createClient();
            const viaProxy = client.chat.system('be brief').user('hi').build();
            const viaBuilder = client.chat.builder().system('be brief').user('hi').build();
            expect(viaProxy.messages).toEqual(viaBuilder.messages);
        });
    });
});
