import {PrMetricSummary} from '../../types';
import {EvaluatorDB} from '../../db';

import logger from '../../utils/logger';
import {AnalysisResult} from "@holokai/types/entities";

export class AnalysisResultsRepository {
    private evaluatorDB: EvaluatorDB;
    private analysisName = 'all_prmetric';

    constructor(client: EvaluatorDB) {
        this.evaluatorDB = client;
    }

    async ensureRecordExists(): Promise<AnalysisResult | null> {
        const analysisResultRecord = await this.evaluatorDB.getAnalysisResultByName(this.analysisName);
        if (analysisResultRecord) {
            // Ensure metrics array exists
            if (!analysisResultRecord.results.metrics) {
                analysisResultRecord.results.metrics = [];
            }
            return analysisResultRecord;
        }

        const newResults = {metrics: []};
        await this.evaluatorDB.insertAnalysisResult(this.analysisName, JSON.stringify(newResults));
        return Promise.resolve(await this.evaluatorDB.getAnalysisResultByName(this.analysisName));
    }

    async upsertMetric(metric: PrMetricSummary): Promise<void> {
        // Get or create the record
        const record = await this.ensureRecordExists();
        if (!record) return Promise.resolve();

        // Find existing metric
        const index = record.results.metrics.findIndex(
            (item: PrMetricSummary) => item.organization === metric.organization &&
                item.repository === metric.repository &&
                item.prid === metric.prid
        );

        if (index >= 0) {
            // Update existing
            record.results.metrics[index] = metric;
        } else {
            // Insert new
            record.results.metrics.push(metric);
        }

        // Save back to database
        await this.evaluatorDB.updateAnalysisResult(JSON.stringify(record.results), record.id);
        logger.debug(`Updated analysis results for pr ${metric.prid}.`)
    }

}
