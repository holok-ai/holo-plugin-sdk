import {PluginManifest, PluginType} from "@holokai/types/plugin";

export const manifest: PluginManifest = {
    name: '@holokai/provider-openai',
    version: '1.0.0',
    pluginType: PluginType.PROVIDER,
    family: 'openai',
    displayName: 'OpenAI Provider',
    description: 'OpenAI provider plugin for Holo.',
};
