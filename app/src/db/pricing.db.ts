import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';
import type {PricingPlan, PricingSheet, PricingSheetModel} from '@holokai/types/entities';

@injectable()
export class PricingDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async upsertPlan(
        pluginFamily: string,
        name: string,
        source: string,
        isDefault: boolean,
        readOnly: boolean,
        description?: string,
        currency = 'USD'
    ): Promise<PricingPlan | null> {
        const existing = await this.findDefaultPlan(pluginFamily);
        if (existing) {
            return this.db.queryOne<PricingPlan>(
                `UPDATE pricing_plans
                 SET name = $1, description = $2, currency = $3, read_only = $4, updated_at = now()
                 WHERE id = $5
                 RETURNING *`,
                [name, description ?? null, currency, readOnly, existing.id]
            );
        }
        return this.db.queryOne<PricingPlan>(
            `INSERT INTO pricing_plans (plugin_family, name, description, currency, source, is_default, read_only)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [pluginFamily.toUpperCase(), name, description ?? null, currency, source, isDefault, readOnly]
        );
    }

    async findDefaultPlan(pluginFamily: string): Promise<PricingPlan | null> {
        return this.db.queryOne<PricingPlan>(
            `SELECT * FROM pricing_plans
             WHERE plugin_family = $1 AND is_default = true AND active = true`,
            [pluginFamily.toUpperCase()]
        );
    }

    async findPlanById(id: string): Promise<PricingPlan | null> {
        return this.db.queryOne<PricingPlan>(
            `SELECT * FROM pricing_plans WHERE id = $1`, [id]
        );
    }

    async upsertSheet(
        planId: string,
        name: string,
        version: string,
        effectiveFrom: string,
        notes?: string
    ): Promise<PricingSheet | null> {
        const query = `
            INSERT INTO pricing_sheets (plan_id, name, version, effective_from, notes)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (plan_id, version)
                DO UPDATE SET name           = EXCLUDED.name,
                              effective_from = EXCLUDED.effective_from,
                              notes          = EXCLUDED.notes,
                              updated_at     = now()
            RETURNING *
        `;
        return this.db.queryOne<PricingSheet>(query, [
            planId, name, version, effectiveFrom, notes ?? null
        ]);
    }

    async findEffectiveSheet(planId: string, at: Date): Promise<PricingSheet | null> {
        return this.db.queryOne<PricingSheet>(
            `SELECT * FROM pricing_sheets
             WHERE plan_id = $1
               AND effective_from <= $2
               AND (effective_to IS NULL OR effective_to > $2)
             ORDER BY effective_from DESC
             LIMIT 1`,
            [planId, at.toISOString()]
        );
    }

    async findSheetsByPlanId(planId: string): Promise<PricingSheet[]> {
        return this.db.query<PricingSheet>(
            `SELECT * FROM pricing_sheets WHERE plan_id = $1 ORDER BY effective_from DESC`,
            [planId]
        );
    }

    async upsertSheetModel(
        sheetId: string,
        modelName: string,
        costs: {
            input_cost: number;
            output_cost: number;
            cache_read_cost?: number;
            cache_write_cost?: number;
            batch_input_cost?: number;
            batch_output_cost?: number;
            context_threshold?: number;
            extended_input_cost?: number;
            extended_output_cost?: number;
        }
    ): Promise<PricingSheetModel | null> {
        const query = `
            INSERT INTO pricing_sheet_models
                (sheet_id, model_name, input_cost, output_cost,
                 cache_read_cost, cache_write_cost, batch_input_cost, batch_output_cost,
                 context_threshold, extended_input_cost, extended_output_cost)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (sheet_id, model_name)
                DO UPDATE SET input_cost          = EXCLUDED.input_cost,
                              output_cost         = EXCLUDED.output_cost,
                              cache_read_cost     = EXCLUDED.cache_read_cost,
                              cache_write_cost    = EXCLUDED.cache_write_cost,
                              batch_input_cost    = EXCLUDED.batch_input_cost,
                              batch_output_cost   = EXCLUDED.batch_output_cost,
                              context_threshold   = EXCLUDED.context_threshold,
                              extended_input_cost = EXCLUDED.extended_input_cost,
                              extended_output_cost = EXCLUDED.extended_output_cost,
                              updated_at          = now()
            RETURNING *
        `;
        return this.db.queryOne<PricingSheetModel>(query, [
            sheetId,
            modelName,
            costs.input_cost,
            costs.output_cost,
            costs.cache_read_cost ?? 0,
            costs.cache_write_cost ?? 0,
            costs.batch_input_cost ?? 0,
            costs.batch_output_cost ?? 0,
            costs.context_threshold ?? null,
            costs.extended_input_cost ?? null,
            costs.extended_output_cost ?? null
        ]);
    }

    async findModelPricing(sheetId: string, modelName: string): Promise<PricingSheetModel | null> {
        return this.db.queryOne<PricingSheetModel>(
            `SELECT * FROM pricing_sheet_models
             WHERE sheet_id = $1 AND model_name = $2`,
            [sheetId, modelName]
        );
    }

    async findModelsBySheetId(sheetId: string): Promise<PricingSheetModel[]> {
        return this.db.query<PricingSheetModel>(
            `SELECT * FROM pricing_sheet_models WHERE sheet_id = $1 ORDER BY model_name`,
            [sheetId]
        );
    }

    async deleteStaleModels(sheetId: string, currentModelNames: string[]): Promise<number> {
        if (currentModelNames.length === 0) return 0;
        const placeholders = currentModelNames.map((_, i) => `$${i + 2}`).join(', ');
        const result = await this.db.query(
            `DELETE FROM pricing_sheet_models
             WHERE sheet_id = $1 AND model_name NOT IN (${placeholders})`,
            [sheetId, ...currentModelNames]
        );
        return (result as any).length ?? 0;
    }
}
