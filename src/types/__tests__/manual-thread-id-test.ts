/**
 * Manual test script for thread_id parameter
 * Run with: node --import ./scripts/register-ts-node.mjs src/types/__tests__/manual-thread-id-test.ts
 */

import 'reflect-metadata';
import {WorkerRequestFactory} from '../worker.request.factory.js';
import {ProviderType, RequestType} from '../../providers/types/index.js';
import {HttpApiRequest} from '../../api/types/index.js';
import {JWTPayload} from '../../admin/types/index.js';

console.log('🧪 Testing thread_id parameter implementation (UUID validation)\n');

const mockAuth: JWTPayload = {
    userId: 'test-user-123',
    organizationId: 'test-org-456',
    appSlugs: ['test-app'],
    providerType: ProviderType.OLLAMA,
    iat: Date.now(),
    exp: Date.now() + 3600000
};

// Test 1: WITH valid UUID thread_id
console.log('📋 Test 1: Request WITH valid UUID thread_id');
try {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const requestWithThreadId: HttpApiRequest = {
        body: {
            model: 'llama2',
            messages: [{role: 'user', content: 'Hello with thread_id!'}],
            stream: false,
            thread_id: validUUID
        },
        auth: mockAuth,
        headers: {},
        params: {},
        query: {}
    } as HttpApiRequest;

    const result1 = WorkerRequestFactory.fromRequest(
        ProviderType.OLLAMA,
        'ollama-provider',
        RequestType.CHAT,
        requestWithThreadId,
        'source-with-thread'
    );

    console.log('✅ Result has thread_id:', result1.thread_id);
    console.log('   Expected:', validUUID);
    console.log('   Actual:', result1.thread_id);
    console.log('   Match:', result1.thread_id === validUUID ? '✅ PASS' : '❌ FAIL');
} catch (error) {
    console.error('❌ Test 1 failed:', error);
}

console.log('\n---\n');

// Test 2: WITHOUT thread_id
console.log('📋 Test 2: Request WITHOUT thread_id (backward compatibility)');
try {
    const requestWithoutThreadId: HttpApiRequest = {
        body: {
            model: 'llama2',
            messages: [{role: 'user', content: 'Hello without thread_id!'}],
            stream: false
        },
        auth: mockAuth,
        headers: {},
        params: {},
        query: {}
    } as HttpApiRequest;

    const result2 = WorkerRequestFactory.fromRequest(
        ProviderType.OLLAMA,
        'ollama-provider',
        RequestType.CHAT,
        requestWithoutThreadId,
        'source-without-thread'
    );

    console.log('✅ Result has NO thread_id (undefined):', result2.thread_id);
    console.log('   Expected: undefined');
    console.log('   Actual:', result2.thread_id);
    console.log('   Match:', result2.thread_id === undefined ? '✅ PASS' : '❌ FAIL');
    console.log('   Request still valid:', result2.requestId ? '✅ YES' : '❌ NO');
} catch (error) {
    console.error('❌ Test 2 failed:', error);
}

console.log('\n---\n');

// Test 3: Direct create method with valid UUID thread_id
console.log('📋 Test 3: Direct create() method WITH valid UUID thread_id');
try {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const payload = {
        model: 'llama2',
        messages: [{role: 'user', content: 'Direct test'}],
        stream: false
    };

    const result3 = WorkerRequestFactory.create(
        ProviderType.OLLAMA,
        'ollama-provider',
        RequestType.CHAT,
        payload,
        'source-direct',
        mockAuth,
        validUUID
    );

    console.log('✅ Result has thread_id:', result3.thread_id);
    console.log('   Expected:', validUUID);
    console.log('   Actual:', result3.thread_id);
    console.log('   Match:', result3.thread_id === validUUID ? '✅ PASS' : '❌ FAIL');
} catch (error) {
    console.error('❌ Test 3 failed:', error);
}

console.log('\n---\n');

// Test 4: Direct create method WITHOUT thread_id
console.log('📋 Test 4: Direct create() method WITHOUT thread_id');
try {
    const payload = {
        model: 'llama2',
        messages: [{role: 'user', content: 'Direct test without thread'}],
        stream: false
    };

    const result4 = WorkerRequestFactory.create(
        ProviderType.OLLAMA,
        'ollama-provider',
        RequestType.CHAT,
        payload,
        'source-direct-no-thread',
        mockAuth
    );

    console.log('✅ Result has NO thread_id (undefined):', result4.thread_id);
    console.log('   Expected: undefined');
    console.log('   Actual:', result4.thread_id);
    console.log('   Match:', result4.thread_id === undefined ? '✅ PASS' : '❌ FAIL');
} catch (error) {
    console.error('❌ Test 4 failed:', error);
}

console.log('\n---\n');

// Test 5: INVALID UUID thread_id (should fail validation)
console.log('📋 Test 5: Request WITH invalid UUID thread_id (should fail)');
try {
    const invalidUUID = 'thread_abc123_not_a_uuid';
    const requestWithInvalidThreadId: HttpApiRequest = {
        body: {
            model: 'llama2',
            messages: [{role: 'user', content: 'Invalid UUID test'}],
            stream: false,
            thread_id: invalidUUID
        },
        auth: mockAuth,
        headers: {},
        params: {},
        query: {}
    } as HttpApiRequest;

    const result5 = WorkerRequestFactory.fromRequest(
        ProviderType.OLLAMA,
        'ollama-provider',
        RequestType.CHAT,
        requestWithInvalidThreadId,
        'source-invalid-thread'
    );

    console.log('❌ FAIL - Should have thrown validation error but didn\'t');
    console.log('   Got result:', result5.thread_id);
} catch (error: any) {
    if (error.message && error.message.includes('UUID')) {
        console.log('✅ PASS - Correctly rejected invalid UUID');
        console.log('   Error message:', error.message);
    } else {
        console.error('❌ FAIL - Threw error but not UUID validation:', error);
    }
}

console.log('\n🎉 All manual tests completed!\n');
