import {loadFixtures} from '../fixtures/fixture-loader.js';
import {loadPlugin} from '../services/plugin-loader.js';
import {testWire, type TestResult} from '../services/wire-tester.js';
import {testAudit} from '../services/audit-tester.js';
import {testPipeline} from '../services/pipeline-tester.js';
import {testRoundTrip} from '../services/sdk-roundtrip-tester.js';
import {reportResults} from '../runner/test-reporter.js';
import type {FixtureScenario} from '../fixtures/types.js';

class SuiteBuilder {
    private _plugin?: string;
    private _protocol?: string;
    private _streaming?: boolean;
    private _fixtureDir?: string;
    private _fixtures?: FixtureScenario[];
    private _categories: Set<string> = new Set();
    private _verbose = false;

    forPlugin(plugin: string): SuiteBuilder {
        this._plugin = plugin;
        return this;
    }

    protocol(protocol: string): SuiteBuilder {
        this._protocol = protocol;
        return this;
    }

    streaming(streaming = true): SuiteBuilder {
        this._streaming = streaming;
        return this;
    }

    fixtureDir(dir: string): SuiteBuilder {
        this._fixtureDir = dir;
        return this;
    }

    withFixtures(fixtures: FixtureScenario[]): SuiteBuilder {
        this._fixtures = fixtures;
        return this;
    }

    wire(): SuiteBuilder {
        this._categories.add('wire');
        return this;
    }

    audit(): SuiteBuilder {
        this._categories.add('audit');
        return this;
    }

    pipeline(): SuiteBuilder {
        this._categories.add('pipeline');
        return this;
    }

    roundTrip(): SuiteBuilder {
        this._categories.add('roundtrip');
        return this;
    }

    allFixtures(): SuiteBuilder {
        return this;
    }

    verbose(verbose = true): SuiteBuilder {
        this._verbose = verbose;
        return this;
    }

    async run(): Promise<boolean> {
        let fixtures = this._fixtures;
        if (!fixtures) {
            const dir = this._fixtureDir || process.cwd();
            fixtures = await loadFixtures(dir, {plugin: this._plugin});
        }

        if (this._protocol) {
            fixtures = fixtures.filter(f => f.protocol === this._protocol);
        }
        if (this._streaming !== undefined) {
            fixtures = fixtures.filter(f => f.streaming === this._streaming);
        }

        const runAll = this._categories.size === 0;
        const results: TestResult[] = [];

        for (const fixture of fixtures) {
            const pluginImpl = await loadPlugin(fixture.plugin);

            if (runAll || this._categories.has('wire')) {
                results.push(await testWire(pluginImpl, fixture));
            }
            if (runAll || this._categories.has('audit')) {
                if (fixture.expectedAudit) {
                    results.push(await testAudit(pluginImpl, fixture));
                }
            }
            if (runAll || this._categories.has('pipeline')) {
                results.push(await testPipeline(pluginImpl, fixture));
            }
            if (this._categories.has('roundtrip') && fixture.sdkAdapter && fixture.sdkRequest) {
                results.push(await testRoundTrip(fixture, fixture.sdkAdapter));
            }
        }

        return reportResults(results, this._verbose);
    }
}

export function suite(): SuiteBuilder {
    return new SuiteBuilder();
}
