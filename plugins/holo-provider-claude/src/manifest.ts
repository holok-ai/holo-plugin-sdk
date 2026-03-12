import {PluginManifest, PluginType} from "@holokai/types/plugin";
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {version} = require('../package.json');

export const manifest: PluginManifest = {
    name: '@holokai/provider-claude',
    version,
    pluginType: PluginType.PROVIDER,
    family: 'claude',
    displayName: 'Claude Provider',
    description: 'Anthropic Claude provider plugin for Holo.',
};
