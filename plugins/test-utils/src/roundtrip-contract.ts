import {testRoundTrip} from '@holokai/test-harness';
import type {FixtureScenario, SdkAdapter} from '@holokai/test-harness';
import {assertTestResult} from './vitest-helpers.js';

export async function runRoundTripContract(fixture: FixtureScenario, adapter: SdkAdapter): Promise<void> {
    if (!fixture.sdkRequest || !fixture.expectedSdkResult) return;
    const result = await testRoundTrip(fixture, adapter);
    assertTestResult(result);
}
