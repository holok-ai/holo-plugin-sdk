import {BasePlugin} from './base';
import type {
    AuditFieldMapping,
    DatastoreConfigField,
    IDatastoreInstance,
    IDatastorePlugin,
    PluginContext,
} from '@holokai/holo-types/plugin';
import type {PricingSheetModel} from '@holokai/holo-types/entities';

export abstract class BaseDatastorePlugin extends BasePlugin implements IDatastorePlugin {

    abstract getConfigSchema(): DatastoreConfigField[];

    abstract getDefaultMapping(): AuditFieldMapping;

    abstract createInstance(config: Record<string, any>): Promise<IDatastoreInstance>;

    protected calculateExtraCosts(
        _tokens: Record<string, number>,
        _pricing: PricingSheetModel,
    ): { total: number; detail: Record<string, { tokens: number; cost: number }> } {
        return {total: 0, detail: {}};
    }

    protected abstract onInitialize(context: PluginContext): Promise<void>;

    protected abstract onDestroy(): Promise<void>;
}
