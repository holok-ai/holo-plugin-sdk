import type {TestResult} from '../services/wire-tester.js';

export function reportResults(results: TestResult[], verbose: boolean): boolean {
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);

    console.log('');
    console.log('='.repeat(60));
    console.log(`  Test Results: ${passed.length} passed, ${failed.length} failed, ${results.length} total`);
    console.log('='.repeat(60));
    console.log('');

    for (const result of results) {
        const icon = result.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
        const duration = result.duration.toFixed(1);
        console.log(`  ${icon}  [${result.category}] ${result.name} (${duration}ms)`);

        if (!result.passed && (verbose || failed.length <= 5)) {
            for (const err of result.errors) {
                console.log(`         \x1b[31m${err.field}: expected ${format(err.expected)}, got ${format(err.actual)}\x1b[0m`);
                if (err.diff && verbose) {
                    console.log('         diff:');
                    for (const line of err.diff.split('\n')) {
                        const color = line.startsWith('+') ? '\x1b[32m' : line.startsWith('-') ? '\x1b[31m' : '';
                        const reset = color ? '\x1b[0m' : '';
                        console.log(`           ${color}${line}${reset}`);
                    }
                }
            }
        }
    }

    console.log('');

    if (failed.length === 0) {
        console.log('\x1b[32mAll tests passed.\x1b[0m');
    } else {
        console.log(`\x1b[31m${failed.length} test(s) failed.\x1b[0m`);
    }

    console.log('');
    return failed.length === 0;
}

function format(val: any): string {
    if (typeof val === 'string') {
        return val.length > 80 ? `"${val.slice(0, 80)}..."` : `"${val}"`;
    }
    return JSON.stringify(val);
}
