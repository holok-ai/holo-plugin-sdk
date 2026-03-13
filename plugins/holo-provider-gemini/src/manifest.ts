import {PluginManifest, PluginType} from "@holokai/types/plugin";
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {version} = require('../package.json');

export const manifest: PluginManifest = {
    name: '@holokai/provider-gemini',
    version,
    pluginType: PluginType.PROVIDER,
    family: 'gemini',
    displayName: 'Gemini Provider',
    description: 'Google Gemini provider plugin for Holo.',
};
