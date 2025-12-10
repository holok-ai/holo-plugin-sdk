/**
 * OpenAI Provider Plugin Implementation
 *
 * Implements IProviderPlugin contract for OpenAI API
 */

import {BasePlugin, IProviderPlugin, PluginContext} from '@holokai/sdk/plugin';
import {manifest} from "./manifest.js";
import {ProviderCapabilities, ProviderConfig} from "@holokai/sdk/provider";

export class OpenAIProviderPlugin extends BasePlugin implements IProviderPlugin {
    createProvider(_config: ProviderConfig): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

    getCapabilities(): ProviderCapabilities {
        return {
            streaming: true,
            tools: true,
            vision: true,
            functionCalling: true,
            maxTokens: 128000
        };
    }

    getSupportedModels(): string[] {
        return [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo'
        ];
    }

    manifest = manifest;

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
