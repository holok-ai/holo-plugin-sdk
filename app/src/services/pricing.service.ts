import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ClassLogger} from '@holokai/sdk';
import {PricingDB, ProviderResponseCostDB, ProviderDB, PluginDB, AppDB} from '../db';
import type {ProviderResponse, PricingSheetModel, ProviderResponseCost} from '@holokai/types/entities';
import {CostType} from '@holokai/types/entities';
import type {IProviderPlugin} from '@holokai/types/plugin';
import {PluginService} from './plugin/plugin.service';

@injectable()
export class PricingService extends ClassLogger {
    constructor(
        private readonly pricingDB: PricingDB,
        private readonly costDB: ProviderResponseCostDB,
        private readonly providerDB: ProviderDB,
        private readonly pluginDB: PluginDB,
        private readonly pluginService: PluginService,
        private readonly db: AppDB,
    ) {
        super();
    }

    async calculateAndInsertCosts(responseId: string, response: ProviderResponse): Promise<number> {
        const logger = this.mlog(this.calculateAndInsertCosts);

        const provider = await this.providerDB.getById(response.provider_id);
        if (!provider) {
            logger.warn(`Provider ${response.provider_id} not found, skipping cost calculation`);
            return 0;
        }

        let plan = provider.pricing_plan_id
            ? await this.pricingDB.findPlanById(provider.pricing_plan_id)
            : null;

        if (!plan) {
            const plugin = await this.pluginDB.getDefault(provider.type);
            if (plugin?.default_pricing_plan_id) {
                plan = await this.pricingDB.findPlanById(plugin.default_pricing_plan_id);
            }
        }

        if (!plan) {
            logger.debug(`No pricing plan found for provider ${provider.name} (family=${provider.type})`);
            return 0;
        }

        const responseTime = new Date(response.created_at);
        const sheet = await this.pricingDB.findEffectiveSheet(plan.id, responseTime);
        if (!sheet) {
            logger.debug(`No effective pricing sheet for plan ${plan.name} at ${response.created_at}`);
            return 0;
        }

        const modelPricing = await this.pricingDB.findModelPricing(sheet.id, response.access_model);
        if (!modelPricing) {
            logger.debug(`No pricing for model ${response.access_model} in sheet ${sheet.name}`);
            return 0;
        }

        const tokenBreakdown = response.metadata?.token_breakdown;

        if (tokenBreakdown) {
            const pluginImpl = await this.pluginService.getImplByFamily(provider.type) as IProviderPlugin | null;
            if (pluginImpl) {
                const costResult = pluginImpl.calculateCost(tokenBreakdown, modelPricing);

                const costRecord: Omit<ProviderResponseCost, 'id' | 'created_at'> = {
                    response_id: responseId,
                    cost_type: CostType.PROVIDER,
                    pricing_sheet_id: sheet.id,
                    input_tokens: tokenBreakdown.input ?? 0,
                    output_tokens: tokenBreakdown.output ?? 0,
                    cache_read_tokens: tokenBreakdown.cache_read ?? 0,
                    cache_write_tokens: tokenBreakdown.cache_write ?? 0,
                    input_cost: costResult.input_cost,
                    output_cost: costResult.output_cost,
                    cache_read_cost: costResult.detail.cache_read?.cost ?? 0,
                    cache_write_cost: costResult.detail.cache_write?.cost ?? 0,
                    total_cost: costResult.total_cost,
                    currency: plan.currency,
                    metadata: costResult.detail,
                };

                await this.costDB.insert(costRecord);
                await this.updateResponseCost(responseId, costResult.total_cost);

                logger.debug(`Calculated cost for response ${responseId}: $${costResult.total_cost.toFixed(8)} (${response.access_model})`);
                return costResult.total_cost;
            }
        }

        const tokens = this.extractTokens(response);
        const cost = this.computeCost(modelPricing, tokens);

        const costRecord: Omit<ProviderResponseCost, 'id' | 'created_at'> = {
            response_id: responseId,
            cost_type: CostType.PROVIDER,
            pricing_sheet_id: sheet.id,
            input_tokens: tokens.input,
            output_tokens: tokens.output,
            cache_read_tokens: tokens.cacheRead,
            cache_write_tokens: tokens.cacheWrite,
            input_cost: cost.inputCost,
            output_cost: cost.outputCost,
            cache_read_cost: cost.cacheReadCost,
            cache_write_cost: cost.cacheWriteCost,
            total_cost: cost.totalCost,
            currency: plan.currency,
        };

        await this.costDB.insert(costRecord);

        await this.updateResponseCost(responseId, cost.totalCost);

        logger.debug(`Calculated cost for response ${responseId}: $${cost.totalCost.toFixed(8)} (${response.access_model})`);
        return cost.totalCost;
    }

    async recalculateCosts(responseId: string): Promise<number> {
        const result = await this.bulkRecalculate(
            `pr.id = $1`, [responseId]
        );
        return result.totalCost;
    }

    async recalculateCostsForDateRange(from: Date, to: Date, providerId?: string): Promise<{ rowCount: number; totalCost: number }> {
        const logger = this.mlog(this.recalculateCostsForDateRange);

        const conditions = [`pr.created_at >= $1`, `pr.created_at < $2`];
        const params: any[] = [from.toISOString(), to.toISOString()];

        if (providerId) {
            conditions.push(`pr.provider_id = $${params.length + 1}`);
            params.push(providerId);
        }

        logger.info(`Recalculating costs: ${from.toISOString()} to ${to.toISOString()}${providerId ? ` provider=${providerId}` : ''}`);

        const result = await this.bulkRecalculate(conditions.join(' AND '), params);

        logger.info(`Recalculated ${result.rowCount} responses, total cost: $${result.totalCost.toFixed(6)}`);
        return result;
    }

    private async bulkRecalculate(whereClause: string, params: any[]): Promise<{ rowCount: number; totalCost: number }> {
        const logger = this.mlog(this.bulkRecalculate);

        return this.db.asSystem(async (client) => {
            // Delete existing cost records for the matching responses
            await client.query(
                `DELETE FROM provider_response_costs
                 WHERE response_id IN (SELECT pr.id FROM provider_responses pr WHERE ${whereClause})`,
                params
            );

            // Single query: join responses → providers → plugins → pricing plans → sheets → model costs
            // Reads token_breakdown JSONB first, falls back to usage_raw for legacy records
            const insertQuery = `
                WITH matched AS (
                    SELECT
                        pr.id AS response_id,
                        ps.id AS pricing_sheet_id,
                        pp.currency,
                        COALESCE((pr.metadata->'token_breakdown'->>'input')::int, pr.input_tokens, 0) AS input_tokens,
                        COALESCE((pr.metadata->'token_breakdown'->>'output')::int, pr.output_tokens, 0) AS output_tokens,
                        COALESCE((pr.metadata->'token_breakdown'->>'cache_read')::int,
                                 (pr.metadata->'usage_raw'->>'cache_read_input_tokens')::int,
                                 (pr.metadata->'usage_raw'->>'cached_tokens')::int, 0) AS cache_read_tokens,
                        COALESCE((pr.metadata->'token_breakdown'->>'cache_write')::int,
                                 (pr.metadata->'usage_raw'->>'cache_creation_input_tokens')::int, 0) AS cache_write_tokens,
                        CASE
                            WHEN psm.context_threshold IS NOT NULL
                                 AND psm.extended_input_cost IS NOT NULL
                                 AND (COALESCE((pr.metadata->'token_breakdown'->>'input')::int, pr.input_tokens, 0)
                                      + COALESCE((pr.metadata->'token_breakdown'->>'cache_read')::int,
                                                 (pr.metadata->'usage_raw'->>'cache_read_input_tokens')::int,
                                                 (pr.metadata->'usage_raw'->>'cached_tokens')::int, 0)
                                      + COALESCE((pr.metadata->'token_breakdown'->>'cache_write')::int,
                                                 (pr.metadata->'usage_raw'->>'cache_creation_input_tokens')::int, 0))
                                     > psm.context_threshold
                            THEN psm.extended_input_cost
                            ELSE psm.input_cost
                        END AS effective_input_cost,
                        CASE
                            WHEN psm.context_threshold IS NOT NULL
                                 AND psm.extended_output_cost IS NOT NULL
                                 AND (COALESCE((pr.metadata->'token_breakdown'->>'input')::int, pr.input_tokens, 0)
                                      + COALESCE((pr.metadata->'token_breakdown'->>'cache_read')::int,
                                                 (pr.metadata->'usage_raw'->>'cache_read_input_tokens')::int,
                                                 (pr.metadata->'usage_raw'->>'cached_tokens')::int, 0)
                                      + COALESCE((pr.metadata->'token_breakdown'->>'cache_write')::int,
                                                 (pr.metadata->'usage_raw'->>'cache_creation_input_tokens')::int, 0))
                                     > psm.context_threshold
                            THEN psm.extended_output_cost
                            ELSE psm.output_cost
                        END AS effective_output_cost,
                        psm.cache_read_cost AS cache_read_cost_per_token,
                        psm.cache_write_cost AS cache_write_cost_per_token,
                        COALESCE((pr.metadata->'token_breakdown'->>'thinking')::int, 0) AS thinking_tokens,
                        COALESCE((psm.token_costs->>'thinking')::numeric, 0) AS thinking_cost_per_token
                    FROM provider_responses pr
                        JOIN providers prov ON pr.provider_id = prov.id
                        JOIN plugins pl ON prov.plugin_id = pl.id
                        LEFT JOIN pricing_plans pp ON pp.id = COALESCE(prov.pricing_plan_id, pl.default_pricing_plan_id)
                        LEFT JOIN pricing_sheets ps ON ps.plan_id = pp.id
                            AND ps.effective_from <= pr.created_at
                            AND (ps.effective_to IS NULL OR ps.effective_to > pr.created_at)
                        LEFT JOIN pricing_sheet_models psm ON psm.sheet_id = ps.id
                            AND psm.model_name = pr.access_model
                    WHERE ${whereClause}
                      AND pp.id IS NOT NULL
                      AND ps.id IS NOT NULL
                      AND psm.id IS NOT NULL
                ),
                inserted AS (
                    INSERT INTO provider_response_costs
                        (response_id, cost_type, pricing_sheet_id,
                         input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                         input_cost, output_cost, cache_read_cost, cache_write_cost,
                         total_cost, currency)
                    SELECT
                        response_id, 'provider', pricing_sheet_id,
                        input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                        input_tokens * effective_input_cost,
                        output_tokens * effective_output_cost,
                        cache_read_tokens * cache_read_cost_per_token,
                        cache_write_tokens * cache_write_cost_per_token,
                        (input_tokens * effective_input_cost)
                            + (output_tokens * effective_output_cost)
                            + (cache_read_tokens * cache_read_cost_per_token)
                            + (cache_write_tokens * cache_write_cost_per_token)
                            + (thinking_tokens * thinking_cost_per_token),
                        currency
                    FROM matched
                    RETURNING response_id, total_cost
                )
                SELECT COUNT(*)::int AS row_count, COALESCE(SUM(total_cost), 0)::float AS total_cost
                FROM inserted
            `;

            const insertResult = await client.query(insertQuery, params);
            const result = insertResult.rows[0] ?? { row_count: 0, total_cost: 0 };

            // Update denormalized cost on provider_responses
            await client.query(
                `UPDATE provider_responses pr
                 SET cost = prc.total_cost
                 FROM provider_response_costs prc
                 WHERE prc.response_id = pr.id
                   AND prc.cost_type = 'provider'
                   AND pr.id IN (SELECT pr2.id FROM provider_responses pr2 WHERE ${whereClause})`,
                params
            );

            logger.info(`Bulk recalculated ${result.row_count} cost records`);
            return { rowCount: result.row_count, totalCost: result.total_cost };
        });
    }

    private extractTokens(response: ProviderResponse): LegacyTokenBreakdown {
        const usageRaw = response.metadata?.usage_raw;

        return {
            input: response.input_tokens ?? 0,
            output: response.output_tokens ?? 0,
            cacheRead: usageRaw?.cache_read_input_tokens ?? usageRaw?.cached_tokens ?? 0,
            cacheWrite: usageRaw?.cache_creation_input_tokens ?? 0,
        };
    }

    private computeCost(pricing: PricingSheetModel, tokens: LegacyTokenBreakdown): LegacyCostBreakdown {
        let inputCostPerToken = Number(pricing.input_cost);
        let outputCostPerToken = Number(pricing.output_cost);

        if (pricing.context_threshold && pricing.extended_input_cost && pricing.extended_output_cost) {
            const totalInput = tokens.input + tokens.cacheRead + tokens.cacheWrite;
            if (totalInput > pricing.context_threshold) {
                inputCostPerToken = Number(pricing.extended_input_cost);
                outputCostPerToken = Number(pricing.extended_output_cost);
            }
        }

        const inputCost = tokens.input * inputCostPerToken;
        const outputCost = tokens.output * outputCostPerToken;
        const cacheReadCost = tokens.cacheRead * Number(pricing.cache_read_cost);
        const cacheWriteCost = tokens.cacheWrite * Number(pricing.cache_write_cost);

        return {
            inputCost,
            outputCost,
            cacheReadCost,
            cacheWriteCost,
            totalCost: inputCost + outputCost + cacheReadCost + cacheWriteCost,
        };
    }

    private async updateResponseCost(responseId: string, cost: number): Promise<void> {
        await this.db.query(
            `UPDATE provider_responses SET cost = $1 WHERE id = $2`,
            [cost, responseId]
        );
    }
}

interface LegacyTokenBreakdown {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
}

interface LegacyCostBreakdown {
    inputCost: number;
    outputCost: number;
    cacheReadCost: number;
    cacheWriteCost: number;
    totalCost: number;
}
