import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ClassLogger} from '@holokai/sdk';
import {RouteDefinition} from "@holokai/types/routing";
import {ProtocolDB} from '../../db';
import {Protocol} from "@holokai/types/entities";

@injectable()
export class ProviderPluginService extends ClassLogger {

    private readonly pluginProtocols: Map<string, Map<string, Protocol>> = new Map();

    constructor(
        private protocolDB: ProtocolDB,
    ) {
        super();
    }

    async registerProtocols(pluginId: string, routes: RouteDefinition[]): Promise<void> {
        const logger = this.mlog(this.registerProtocols);
        let protocols = this.pluginProtocols.get(pluginId);
        if (!protocols) {
            protocols = new Map();
            this.pluginProtocols.set(pluginId, protocols);
        }
        for (const routeDef of routes) {
            const {protocol} = routeDef;
            const path = routeDef.paths.join(',');
            const dbProtocol = await this.protocolDB.upsert(pluginId, protocol.name, protocol.capability, path);

            if (!dbProtocol) {
                logger.warn(`Unable to upsert protocol ${protocol.name}`);
            } else {
                protocols.set(dbProtocol.name, dbProtocol);
            }
        }
    }


    removeProtocols(pluginId: string): void {
        this.pluginProtocols.delete(pluginId);
    }

    async getProtocol(pluginId: string, protocolName: string): Promise<Protocol> {
        return this.pluginProtocols.get(pluginId)?.get(protocolName)!;
    }
}
