/**
 * OpenAI Provider Plugin Implementation
 *
 * Implements IProviderPlugin contract for OpenAI API
 */

import {BasePlugin, IProviderPlugin, PluginContext} from '@holokai/sdk/plugin';
import {manifest} from "./manifest";
import {ProviderCapabilities, ProviderConfig} from "@holokai/sdk";

export class OpenAIProviderPlugin extends BasePlugin implements IProviderPlugin {
    createProvider(config: ProviderConfig): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

    getCapabilities(): ProviderCapabilities {
        return manifest.capabilities || {} as ProviderCapabilities;
    }

    getSupportedModels(): string[] {
        throw new Error("Method not implemented.");
    }

    manifest = manifest;

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
