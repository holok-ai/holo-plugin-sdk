import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import type {ProviderResponseCost} from '@holokai/types/entities';

@injectable()
export class ProviderResponseCostDB {
    constructor(private db: AppDB) {}

    async insert(cost: Omit<ProviderResponseCost, 'id' | 'created_at'>): Promise<{ id: string } | null> {
        const query = `
            INSERT INTO provider_response_costs
                (response_id, cost_type, pricing_sheet_id,
                 input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                 input_cost, output_cost, cache_read_cost, cache_write_cost,
                 total_cost, currency, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `;
        return this.db.queryOne<{ id: string }>(query, [
            cost.response_id,
            cost.cost_type,
            cost.pricing_sheet_id ?? null,
            cost.input_tokens,
            cost.output_tokens,
            cost.cache_read_tokens,
            cost.cache_write_tokens,
            cost.input_cost,
            cost.output_cost,
            cost.cache_read_cost,
            cost.cache_write_cost,
            cost.total_cost,
            cost.currency,
            cost.metadata ? JSON.stringify(cost.metadata) : '{}',
        ]);
    }

    async findByResponseId(responseId: string): Promise<ProviderResponseCost[]> {
        return this.db.query<ProviderResponseCost>(
            `SELECT * FROM provider_response_costs WHERE response_id = $1 ORDER BY cost_type`,
            [responseId]
        );
    }

    async deleteByResponseId(responseId: string): Promise<void> {
        await this.db.query(
            `DELETE FROM provider_response_costs WHERE response_id = $1`,
            [responseId]
        );
    }
}
