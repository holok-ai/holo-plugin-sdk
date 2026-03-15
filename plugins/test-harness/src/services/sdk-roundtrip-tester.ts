import type {FixtureScenario, SdkAdapter} from '../fixtures/types.js';
import {type AssertionError, assertPartialMatch} from '../dsl/assertions.js';
import type {TestResult} from './wire-tester.js';
import {HttpFixtureServer} from './http-fixture-server.js';
import {loadPlugin} from './plugin-loader.js';

export async function testRoundTrip(
    fixture: FixtureScenario,
    adapter: SdkAdapter
): Promise<TestResult> {
    const start = performance.now();
    const errors: AssertionError[] = [];

    if (!fixture.sdkRequest || !fixture.expectedSdkResult) {
        return {
            name: fixture.name,
            category: 'roundtrip',
            passed: true,
            errors: [],
            duration: performance.now() - start,
        };
    }

    const plugin = await loadPlugin(fixture.plugin);
    const server = new HttpFixtureServer();
    server.mount(fixture, plugin, adapter);

    let port: number;
    try {
        port = await server.start();
    } catch (err) {
        return {
            name: fixture.name,
            category: 'roundtrip',
            passed: false,
            errors: [{field: 'server', expected: 'started', actual: `error: ${err}`}],
            duration: performance.now() - start,
        };
    }

    try {
        const result = await adapter.call(fixture, port);

        if (typeof fixture.expectedSdkResult === 'object' && !Array.isArray(fixture.expectedSdkResult)) {
            const err = assertPartialMatch('sdkResult', result, fixture.expectedSdkResult);
            if (err) errors.push(err);
        } else if (Array.isArray(fixture.expectedSdkResult)) {
            if (!Array.isArray(result)) {
                errors.push({field: 'sdkResult', expected: 'array', actual: typeof result});
            } else if (result.length !== fixture.expectedSdkResult.length) {
                errors.push({
                    field: 'sdkResult.length',
                    expected: fixture.expectedSdkResult.length,
                    actual: result.length,
                });
            } else {
                for (let i = 0; i < fixture.expectedSdkResult.length; i++) {
                    const err = assertPartialMatch(`sdkResult[${i}]`, result[i], fixture.expectedSdkResult[i]);
                    if (err) errors.push(err);
                }
            }
        }
    } catch (err) {
        errors.push({
            field: 'sdk.call',
            expected: 'success',
            actual: `error: ${(err as Error).message}`,
        });
    } finally {
        await server.stop();
    }

    return {
        name: fixture.name,
        category: 'roundtrip',
        passed: errors.length === 0,
        errors,
        duration: performance.now() - start,
    };
}
