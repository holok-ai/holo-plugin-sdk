import {DatabaseService, db} from './database.service';
import {Model, Provider} from '../types';
import AIProvider from "../providers/ai.provider";
import {OpenAIProvider} from "../providers/openai.provider";
import logger from "../utils/logger";

export class ProviderService {

    private db: DatabaseService;
    private aiProviders: Map<string, AIProvider> = new Map();

    constructor(databaseService: DatabaseService = db) {
        this.db = databaseService;
    }

    async init(): Promise<void> {
        if (!this.db.isConnected()) {
            await this.db.connect();
        }

        await this.refreshAvailableProviders();
    }

    async getProviders(): Promise<Provider[]> {
        const query = `
            SELECT *
            FROM providers
            WHERE status ->> 'enabled' = 'true'
              AND status ->> 'available' = 'true'
            ORDER BY name
        `;
        return this.db.query<Provider>(query);
    }

    async refreshAvailableProviders() {
        const providers = await this.getProviders();
        if (providers.length === 0) return;
        for (const provider of providers) {
            if (provider.name === 'openai') {
                logger.debug('yo')
                this.aiProviders.set('openai', new OpenAIProvider(provider.config as any));
            }
        }
    }

    async matchProvider(key: string): Promise<AIProvider | undefined> {
        return this.aiProviders.get(key);
    }

    async getProvider(name: string): Promise<Provider | null> {
        const query = `SELECT *
                       FROM providers
                       WHERE name = $1
                         AND status = true`;
        return this.db.queryOne<Provider>(query, [name]);
    }

    async getProviderModels(providerId: string): Promise<Array<Model & { provider_config: any }>> {
        const query = `
            SELECT m.*,
                   pm.config as provider_config
            FROM models m
                     JOIN provider_models pm ON m.id = pm.model_id
            WHERE pm.provider_id = $1
              AND pm.active = true
              AND m.status ->> 'enabled' = 'true'
              AND m.status ->> 'available' = 'true'
            ORDER BY m.name
        `;
        return this.db.query(query, [providerId]);
    }

    async getActiveProviderModels(): Promise<Array<Provider & { models: Model[] }>> {
        const query = `
            SELECT COALESCE(
                                   json_agg(
                                   json_build_object(
                                           'id', m.id,
                                           'name', m.name,
                                           'description', m.description,
                                           'capabilities', m.capabilities,
                                           'parameters', m.parameters,
                                           'status', m.status,
                                           'provider_config', pm.config
                                   )
                                           ) FILTER (WHERE m.id IS NOT NULL),
                                   '[]'::json
                   ) as models
            FROM providers p
                     LEFT JOIN provider_models pm ON p.id = pm.provider_id AND pm.active = true
                     LEFT JOIN models m ON pm.model_id = m.id AND m.status ->> 'enabled' = 'true'
            WHERE p.status ->> 'enabled' = true
            GROUP BY p.name
            ORDER BY p.name
        `;
        return this.db.query(query);
    }
}

export const providerService = new ProviderService();
