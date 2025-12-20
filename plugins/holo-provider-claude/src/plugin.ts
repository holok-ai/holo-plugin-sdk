/**
 * Claude Provider Plugin Implementation
 *
 * Implements IProviderPlugin contract for Claude/Anthropic API
 */

import {BasePlugin, IProviderPlugin, PluginContext} from '@holokai/sdk/plugin';
import {manifest} from "./manifest.js";
import {IProvider, ProviderCapabilities} from "@holokai/sdk/provider";
import {ClaudeProvider} from "./claude.provider";

export class ClaudeProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;

    async createProvider(config: any): Promise<IProvider> {
        return new ClaudeProvider(config);
    }

    getCapabilities(): ProviderCapabilities {
        return {
            streaming: true,
            tools: true,
            vision: true,
            functionCalling: true,
            maxTokens: 200000
        };
    }

    getSupportedModels(): string[] {
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
