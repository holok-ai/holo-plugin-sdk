import {PluginManifest, PluginType} from "@holokai/types/plugin";

export const manifest: PluginManifest = {
    name: '@holokai/provider-claude',
    version: '1.0.0',
    pluginType: PluginType.PROVIDER,
    family: 'claude',
    displayName: 'Claude Provider',
    description: 'Anthropic Claude provider plugin for Holo.',
};
