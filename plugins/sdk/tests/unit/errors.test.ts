import {describe, it, expect} from 'vitest';
import {HoloApiError, HoloStreamError, HoloTimeoutError} from '../../src/client/errors.js';

describe('HoloApiError', () => {
    it('sets name, message, and status', () => {
        const err = new HoloApiError('Not Found', 404);
        expect(err.name).toBe('HoloApiError');
        expect(err.message).toBe('Not Found');
        expect(err.status).toBe(404);
        expect(err).toBeInstanceOf(Error);
    });

    it('includes optional code and body', () => {
        const body = {error: 'invalid_token'};
        const err = new HoloApiError('Unauthorized', 401, 'auth_error', body);
        expect(err.code).toBe('auth_error');
        expect(err.body).toEqual(body);
    });

    it('omits code and body when not provided', () => {
        const err = new HoloApiError('Server Error', 500);
        expect(err.code).toBeUndefined();
        expect(err.body).toBeUndefined();
    });
});

describe('HoloStreamError', () => {
    it('sets name and message', () => {
        const err = new HoloStreamError('Stream failed');
        expect(err.name).toBe('HoloStreamError');
        expect(err.message).toBe('Stream failed');
        expect(err).toBeInstanceOf(Error);
    });

    it('includes optional event', () => {
        const event = {type: 'response.failed', error: {message: 'oops'}};
        const err = new HoloStreamError('Failed', event);
        expect(err.event).toEqual(event);
    });
});

describe('HoloTimeoutError', () => {
    it('sets name, message, and timeoutMs', () => {
        const err = new HoloTimeoutError(5000);
        expect(err.name).toBe('HoloTimeoutError');
        expect(err.message).toBe('Request timed out after 5000ms');
        expect(err.timeoutMs).toBe(5000);
        expect(err).toBeInstanceOf(Error);
    });
});
