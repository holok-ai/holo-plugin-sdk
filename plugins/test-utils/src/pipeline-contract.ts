import type {FixtureScenario} from '@holokai/test-harness';
import {loadPlugin, testPipeline} from '@holokai/test-harness';
import {assertTestResult} from './vitest-helpers.js';

export async function runPipelineContract(family: string, fixture: FixtureScenario): Promise<void> {
    const plugin = await loadPlugin(family);
    const result = await testPipeline(plugin, fixture);
    assertTestResult(result);
}
