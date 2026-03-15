import {expect} from 'vitest';
import type {TestResult} from '@holokai/test-harness';

export function assertTestResult(result: TestResult): void {
    if (result.passed) return;

    const messages = result.errors.map((e) => {
        let msg = `${e.field}: expected ${JSON.stringify(e.expected)}, got ${JSON.stringify(e.actual)}`;
        if (e.diff) msg += `\n${e.diff}`;
        return msg;
    });

    expect.fail(`${result.category} conformance failed for "${result.name}":\n${messages.join('\n')}`);
}
