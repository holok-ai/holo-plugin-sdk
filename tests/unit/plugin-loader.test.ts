import 'reflect-metadata';
import {describe, it, expect, beforeAll, afterEach} from 'vitest';
import {container} from 'tsyringe';
import type {HoloLogger} from '@holokai/holo-types/logger';
import {
    discoverPlugins,
    loadPlugin,
    loadAllPlugins,
    loadPluginFromPackage,
    familyFromPackage,
    getLoadedPlugins,
    clearPluginCache,
} from '../../src/plugin/loader';

beforeAll(() => {
    const noop = () => {};
    const noopLogger = {
        level: 'silent', info: noop, warn: noop, error: noop,
        debug: noop, verbose: noop, child: () => noopLogger,
    } as unknown as HoloLogger;
    container.register('LoggerFactory', {useValue: () => noopLogger});
});

afterEach(() => {
    clearPluginCache();
});

describe('familyFromPackage', () => {
    it('extracts family from scoped package name', () => {
        expect(familyFromPackage('@holokai/holo-provider-claude')).toBe('claude');
        expect(familyFromPackage('@holokai/holo-provider-openai')).toBe('openai');
    });

    it('returns input unchanged for non-matching names', () => {
        expect(familyFromPackage('some-other-package')).toBe('some-other-package');
    });
});

describe('discoverPlugins', () => {
    it('discovers provider plugins in node_modules', async () => {
        const packages = await discoverPlugins();
        expect(packages.length).toBeGreaterThanOrEqual(1);
        for (const pkg of packages) {
            expect(pkg).toMatch(/^@holokai\/holo-provider-.+/);
        }
    });

    it('discovers plugins from an explicit node_modules path', async () => {
        const packages = await discoverPlugins('node_modules');
        expect(packages.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array for nonexistent path', async () => {
        const packages = await discoverPlugins('/tmp/nonexistent-dir-abc123');
        expect(packages).toEqual([]);
    });
});

describe('loadPlugin', () => {
    it('loads a plugin by family name and initializes it', async () => {
        const plugin = await loadPlugin('claude');
        expect(plugin).toBeDefined();
        expect(plugin.family).toBe('claude');
        expect(plugin.getState()).toBe('READY');
    });

    it('returns cached plugin on second call', async () => {
        const first = await loadPlugin('claude');
        const second = await loadPlugin('claude');
        expect(first).toBe(second);
    });

    it('throws for unknown family', async () => {
        await expect(loadPlugin('nonexistent')).rejects.toThrow();
    });
});

describe('loadPluginFromPackage', () => {
    it('loads a plugin by full package name', async () => {
        const plugin = await loadPluginFromPackage('@holokai/holo-provider-openai');
        expect(plugin).toBeDefined();
        expect(plugin.family).toBe('openai');
    });
});

describe('loadAllPlugins', () => {
    it('discovers and loads all provider plugins', async () => {
        const plugins = await loadAllPlugins();
        expect(plugins.size).toBeGreaterThanOrEqual(1);
        for (const [family, plugin] of plugins) {
            expect(plugin.family).toBe(family);
            expect(plugin.getState()).toBe('READY');
        }
    });

    it('populates the plugin cache', async () => {
        await loadAllPlugins();
        const cached = getLoadedPlugins();
        expect(cached.size).toBeGreaterThanOrEqual(1);
    });
});

describe('clearPluginCache', () => {
    it('clears all cached plugins', async () => {
        await loadPlugin('claude');
        expect(getLoadedPlugins().size).toBe(1);
        clearPluginCache();
        expect(getLoadedPlugins().size).toBe(0);
    });
});
