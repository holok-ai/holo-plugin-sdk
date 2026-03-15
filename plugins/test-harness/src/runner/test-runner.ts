import {loadFixtures} from '../fixtures/fixture-loader.js';
import {loadPlugin} from '../services/plugin-loader.js';
import {type TestResult, testWire} from '../services/wire-tester.js';
import {testAudit} from '../services/audit-tester.js';
import {testPipeline} from '../services/pipeline-tester.js';
import {testRoundTrip} from '../services/sdk-roundtrip-tester.js';
import {reportResults} from './test-reporter.js';

export interface RunOptions {
    fixtureDir: string;
    plugin?: string | undefined;
    tag?: string | undefined;
    wire?: boolean | undefined;
    audit?: boolean | undefined;
    pipeline?: boolean | undefined;
    roundtrip?: boolean | undefined;
    verbose?: boolean | undefined;
}

export async function runTests(options: RunOptions): Promise<boolean> {
    const {fixtureDir, plugin, tag, verbose = false} = options;
    const runAll = !options.wire && !options.audit && !options.pipeline && !options.roundtrip;

    const fixtures = await loadFixtures(fixtureDir, {plugin, tag});

    if (fixtures.length === 0) {
        console.log('No fixtures found.');
        return true;
    }

    console.log(`Found ${fixtures.length} fixture(s)`);

    const results: TestResult[] = [];

    for (const fixture of fixtures) {
        const pluginImpl = await loadPlugin(fixture.plugin);

        if (runAll || options.wire) {
            results.push(await testWire(pluginImpl, fixture));
        }

        if (runAll || options.audit) {
            if (fixture.expectedAudit) {
                results.push(await testAudit(pluginImpl, fixture));
            }
        }

        if (runAll || options.pipeline) {
            results.push(await testPipeline(pluginImpl, fixture));
        }

        if (options.roundtrip && fixture.sdkAdapter && fixture.sdkRequest) {
            results.push(await testRoundTrip(fixture, fixture.sdkAdapter));
        }
    }

    return reportResults(results, verbose);
}
