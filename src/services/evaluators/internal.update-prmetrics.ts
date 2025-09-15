import { PrMetricSummary  } from '../../types/evaluator-pr.types';
import { AnalysisResult } from '../../db/types';
import { EvaluatorDB } from '../../db/evaluator.db'; 

import logger from '../../utils/logger';

export class AnalysisResultsRepository {
    private evaluatorDB: EvaluatorDB;
    private analysisName = 'all_prmetric';
    
    constructor(client: EvaluatorDB) {
        this.evaluatorDB = client;
    }
    
    async ensureRecordExists(): Promise<AnalysisResult | null> {
        const analysisResultRecord = await this.evaluatorDB.getAnalysisResultByName(this.analysisName);        
        if (analysisResultRecord)  {           
            // Ensure metrics array exists
            if (!analysisResultRecord.results.metrics) {
                analysisResultRecord.results.metrics = [];
            }
            return analysisResultRecord;
        }
        
        const newResults = { metrics: [] };
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

// // Usage
// async function main() {
//     const client = new Client({
//         // connection config
//     });
//     await client.connect();
    
//     try {
//         const repo = new MetricsRepository(client);
        
//         // Upsert a metric (will create record if needed, insert or update metric)
//         await repo.upsertMetric({
//             organization: 'org1',
//             repository: 'alpha',
//             prid: '123',
//             changedFiles: 10,
//             localAdditions: 200,
//             localDeletions: 50,
//             prAdditions: 180,
//             prDeletions: 45,
//             prAdditionsFromLocal: 170,
//             prDeletionsFromLocal: 40,
//             additionPercentage: 85.0,
//             deletionPercentage: 80.0
//         });
        
//     } finally {
//         await client.end();
//     }
// }