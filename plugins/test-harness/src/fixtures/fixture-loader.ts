import {glob} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import type {FixtureScenario} from './types.js';

export async function loadFixtures(baseDir: string, filter?: {
    plugin?: string | undefined;
    tag?: string | undefined;
}): Promise<FixtureScenario[]> {
    const pattern = `${baseDir}/**/*.fixture.{ts,js}`;
    const files: string[] = [];
    for await (const file of glob(pattern)) {
        files.push(file);
    }

    const fixtures: FixtureScenario[] = [];

    for (const file of files.sort()) {
        const mod = await import(pathToFileURL(file).href);
        const scenario: FixtureScenario = mod.default ?? mod.fixture;
        if (!scenario) continue;

        if (filter?.plugin && scenario.plugin !== filter.plugin) continue;
        if (filter?.tag && !scenario.tags?.includes(filter.tag)) continue;

        fixtures.push(scenario);
    }

    return fixtures;
}
