import {loadPlugin, testWire} from '@holokai/test-harness';
import type {FixtureScenario} from '@holokai/test-harness';
import {assertTestResult} from './vitest-helpers.js';

export async function runWireContract(family: string, fixture: FixtureScenario): Promise<void> {
    const plugin = await loadPlugin(family);
    const result = await testWire(plugin, fixture);
    assertTestResult(result);
}
