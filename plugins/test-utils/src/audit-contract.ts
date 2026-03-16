import {loadPlugin, testAudit} from '@holokai/test-harness';
import type {FixtureScenario} from '@holokai/test-harness';
import {assertTestResult} from './vitest-helpers.js';

export async function runAuditContract(family: string, fixture: FixtureScenario): Promise<void> {
    if (!fixture.expectedAudit) return;
    const plugin = await loadPlugin(family);
    const result = await testAudit(plugin, fixture);
    assertTestResult(result);
}
