import {PluginManifest, PluginType} from "@holokai/types/plugin";
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {version} = require('../package.json');

export const manifest: PluginManifest = {
    name: '@holokai/provider-openai',
    version,
    pluginType: PluginType.PROVIDER,
    family: 'openai',
    displayName: 'OpenAI Provider',
    description: 'OpenAI provider plugin for Holo.',
};
