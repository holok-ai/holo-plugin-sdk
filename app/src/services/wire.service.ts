import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClassLogger} from "@holokai/sdk";
import type {IWireAdapter, WireAdapterParams} from "@holokai/types/provider";
import {ProviderPluginRegistry} from "./plugin/provider.registry.service";

@injectable()
export class WireService extends ClassLogger {

    constructor(
        private readonly providerRegistry: ProviderPluginRegistry
    ) {
        super();
    }

    async matchWireAdapter(providerName: string, providerVersion: string, args: WireAdapterParams): Promise<IWireAdapter> {
        const plugin =
            this.providerRegistry.getByFamily(providerName, providerVersion) ??
            this.providerRegistry.getByFamily(providerName);

        if (!plugin) {
            throw new Error(`No plugin found for family=${providerName} version=${providerVersion}`);
        }

        if (!plugin.createWireAdapter) {
            throw new Error(`Plugin ${plugin.manifest?.name ?? providerName} does not implement createWireAdapter()`);
        }

        return plugin.createWireAdapter({
            requestId: args.requestId,
            isStreaming: args.isStreaming,
            requestType: args.requestType,
        });
    }
}