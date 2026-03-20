import type {PluginPricingModel, PluginPricingSheet, PricingDataset, PricingModelId} from '@holokai/holo-types/plugin';

interface ModelCosts {
    input_cost: number;
    output_cost: number;
    cache_read_cost?: number;
    cache_write_cost?: number;
    batch_input_cost?: number;
    batch_output_cost?: number;
    context_threshold?: number;
    extended_input_cost?: number;
    extended_output_cost?: number;
    token_costs?: Record<string, number>;
}

interface ModelIdCosts extends ModelCosts {
    release_date: string;
    shutdown_date: string | null;
}

export function normalizePricingDataset(dataset: PricingDataset): Map<string, PluginPricingSheet> {
    const snapshotsByName = new Map(dataset.pricing_snapshots.map(s => [s.name, s]));

    // Step 1: Build model_id → family pricing lookup
    const modelIdCosts = new Map<string, ModelIdCosts>();
    for (const mid of dataset.model_ids) {
        if (!mid.pricing_snapshot) continue;
        const snapshot = snapshotsByName.get(mid.pricing_snapshot);
        if (!snapshot) continue;
        const familyModel = snapshot.models.find(m => m.model_name === mid.family);
        if (!familyModel) continue;

        const entry: ModelIdCosts = {
            input_cost: familyModel.input_cost,
            output_cost: familyModel.output_cost,
            release_date: mid.release_date,
            shutdown_date: mid.shutdown_date,
        };
        if (familyModel.cache_read_cost !== undefined) entry.cache_read_cost = familyModel.cache_read_cost;
        if (familyModel.cache_write_cost !== undefined) entry.cache_write_cost = familyModel.cache_write_cost;
        if (familyModel.batch_input_cost !== undefined) entry.batch_input_cost = familyModel.batch_input_cost;
        if (familyModel.batch_output_cost !== undefined) entry.batch_output_cost = familyModel.batch_output_cost;
        if (familyModel.context_threshold !== undefined) entry.context_threshold = familyModel.context_threshold;
        if (familyModel.extended_input_cost !== undefined) entry.extended_input_cost = familyModel.extended_input_cost;
        if (familyModel.extended_output_cost !== undefined) entry.extended_output_cost = familyModel.extended_output_cost;
        if (familyModel.token_costs !== undefined) entry.token_costs = familyModel.token_costs;
        modelIdCosts.set(mid.model_id, entry);
    }

    // Step 2: Collect all distinct effective dates
    const dateSet = new Set<string>();
    for (const snapshot of dataset.pricing_snapshots) {
        dateSet.add(snapshot.effective_from);
    }
    for (const mid of dataset.model_ids) {
        if (mid.pricing_snapshot) {
            dateSet.add(mid.release_date);
        }
    }
    const sortedDates = Array.from(dateSet).sort();

    // Build index: date → snapshots effective at that date
    const snapshotsByDate = new Map<string, typeof dataset.pricing_snapshots>();
    for (const snapshot of dataset.pricing_snapshots) {
        const list = snapshotsByDate.get(snapshot.effective_from) ?? [];
        list.push(snapshot);
        snapshotsByDate.set(snapshot.effective_from, list);
    }

    // Build index: date → model_ids releasing at that date
    const modelIdsByDate = new Map<string, PricingModelId[]>();
    for (const mid of dataset.model_ids) {
        if (!mid.pricing_snapshot) continue;
        const list = modelIdsByDate.get(mid.release_date) ?? [];
        list.push(mid);
        modelIdsByDate.set(mid.release_date, list);
    }

    // Step 3: Build compiled snapshots
    let prevModels = new Map<string, PluginPricingModel>();
    const compiledSnapshots: { date: string; models: Map<string, PluginPricingModel> }[] = [];

    for (const date of sortedDates) {
        const currentModels = new Map(prevModels);

        // Apply pricing snapshot changes at this date
        const snapshots = snapshotsByDate.get(date);
        if (snapshots) {
            for (const snapshot of snapshots) {
                for (const model of snapshot.models) {
                    currentModels.set(model.model_name, {...model});
                }
            }
        }

        // Apply model_id entries releasing at this date (alias expansion)
        const releasingModels = modelIdsByDate.get(date);
        if (releasingModels) {
            for (const mid of releasingModels) {
                const costs = modelIdCosts.get(mid.model_id);
                if (!costs) continue;

                // Add the model_id itself
                currentModels.set(mid.model_id, {
                    model_name: mid.model_id,
                    ...extractCosts(costs),
                });

                // Add aliases
                if (mid.aliases) {
                    for (const alias of mid.aliases) {
                        currentModels.set(alias, {
                            model_name: alias,
                            ...extractCosts(costs),
                        });
                    }
                }
            }
        }

        // Remove shutdown models
        for (const [name, _] of currentModels) {
            const mid = dataset.model_ids.find(m => m.model_id === name);
            if (mid?.shutdown_date && mid.shutdown_date <= date) {
                currentModels.delete(name);
                if (mid.aliases) {
                    for (const alias of mid.aliases) {
                        currentModels.delete(alias);
                    }
                }
            }
        }

        compiledSnapshots.push({date, models: currentModels});
        prevModels = currentModels;
    }

    // Step 4 & 5: Compute effective_to and build result map
    const result = new Map<string, PluginPricingSheet>();
    for (let i = 0; i < compiledSnapshots.length; i++) {
        const snapshot = compiledSnapshots[i];
        const effectiveTo = i + 1 < compiledSnapshots.length
            ? compiledSnapshots[i + 1].date
            : undefined;

        const version = snapshot.date;
        const sheet: PluginPricingSheet = {
            name: `${dataset.name} ${version}`,
            version,
            effective_from: snapshot.date,
            models: Array.from(snapshot.models.values()),
        };
        if (effectiveTo !== undefined) sheet.effective_to = effectiveTo;
        result.set(version, sheet);
    }

    return result;
}

function extractCosts(costs: ModelIdCosts): ModelCosts {
    const result: ModelCosts = {
        input_cost: costs.input_cost,
        output_cost: costs.output_cost,
    };
    if (costs.cache_read_cost !== undefined) result.cache_read_cost = costs.cache_read_cost;
    if (costs.cache_write_cost !== undefined) result.cache_write_cost = costs.cache_write_cost;
    if (costs.batch_input_cost !== undefined) result.batch_input_cost = costs.batch_input_cost;
    if (costs.batch_output_cost !== undefined) result.batch_output_cost = costs.batch_output_cost;
    if (costs.context_threshold !== undefined) result.context_threshold = costs.context_threshold;
    if (costs.extended_input_cost !== undefined) result.extended_input_cost = costs.extended_input_cost;
    if (costs.extended_output_cost !== undefined) result.extended_output_cost = costs.extended_output_cost;
    if (costs.token_costs !== undefined) result.token_costs = costs.token_costs;
    return result;
}
