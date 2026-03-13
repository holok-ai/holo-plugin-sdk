#!/usr/bin/env node

import 'reflect-metadata';
import {resolve} from 'node:path';
import {runTests} from './runner/test-runner.js';

function parseArgs(argv: string[]) {
    const args = argv.slice(2);
    const options: Record<string, string | boolean> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--plugin' && i + 1 < args.length) {
            options.plugin = args[++i];
        } else if (arg === '--tag' && i + 1 < args.length) {
            options.tag = args[++i];
        } else if (arg === '--fixtures' && i + 1 < args.length) {
            options.fixtureDir = args[++i];
        } else if (arg === '--wire') {
            options.wire = true;
        } else if (arg === '--audit') {
            options.audit = true;
        } else if (arg === '--pipeline') {
            options.pipeline = true;
        } else if (arg === '--roundtrip') {
            options.roundtrip = true;
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }
    }

    return options;
}

function printHelp() {
    console.log(`
holo-test — Plugin test harness for Holo provider plugins

Usage:
  npx holo-test [options]

Options:
  --plugin <name>     Test only this plugin family (openai, claude, gemini, ollama)
  --tag <tag>         Filter fixtures by tag
  --fixtures <dir>    Path to fixtures directory (default: auto-discover)
  --wire              Run wire format tests only
  --audit             Run audit record tests only
  --pipeline          Run full pipeline tests only
  --roundtrip         Run SDK round-trip tests only
  --verbose, -v       Show diffs on failure
  --help, -h          Show this help
`);
}

async function main() {
    const args = parseArgs(process.argv);

    const originalCwd = process.env['INIT_CWD'] ?? process.cwd();
    const fixtureDir = typeof args.fixtureDir === 'string'
        ? resolve(originalCwd, args.fixtureDir)
        : resolve(originalCwd, 'plugins');

    console.log(`holo-test — fixture dir: ${fixtureDir}`);

    const success = await runTests({
        fixtureDir,
        plugin: typeof args.plugin === 'string' ? args.plugin : undefined,
        tag: typeof args.tag === 'string' ? args.tag : undefined,
        wire: args.wire === true,
        audit: args.audit === true,
        pipeline: args.pipeline === true,
        roundtrip: args.roundtrip === true,
        verbose: args.verbose === true,
    });

    process.exit(success ? 0 : 1);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
