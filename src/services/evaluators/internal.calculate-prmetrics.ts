import { InternalEvaluatorBase } from './internal.base';
import { EvaluatorResult, EvaluatorsDataResults, EvaluatorServiceEvent } from '../../types/evaluator.types';
import { PRFile, PrMetricSummary, ExtractedChanges, UnifiedDiffBlock } from '../../types/evaluator-pr.types';
import { EvaluatorData } from '../../db/types';
import { AnalysisResultsRepository } from './internal.update-prmetrics';

import * as Diff from 'diff';

import logger from '../../utils/logger';


export class CalculatePrMetrics extends InternalEvaluatorBase {
    readonly evaluatorId = "";
    readonly handlesEventName = 'calculate-prmetrics';
    readonly evaluatorName = 'calculate-prmetrics';


    /**
     * Extract PR changes directly from evaluator_data record
     * @param record The evaluator_data record from database
     * @returns Map of filename to extracted changes
     */
    extractPRChanges(record: EvaluatorData): Map<string, ExtractedChanges> {
        const changesByFile = new Map<string, ExtractedChanges>();

        // Check if the record has PR file data
        if (!record.results?.data?.files || !Array.isArray(record.results.data.files)) {
            console.warn(`Record ${record.id} has no files data`);
            return changesByFile;
        }

        const files: PRFile[] = record.results.data.files;

        for (const file of files) {
            const additions = new Set<string>();
            const deletions = new Set<string>();

            // Use diff or patch field
            const diffContent = file.diff || file.patch || '';

            if (diffContent.trim()) {
                const lines = diffContent.split('\n');
                for (const line of lines) {
                    if (line.length > 1) {
                        if (line[0] === '+' && !line.startsWith('+++')) {
                            const content = this.normalizeLine(line.slice(1));
                            if (content) additions.add(content);
                        } else if (line[0] === '-' && !line.startsWith('---')) {
                            const content = this.normalizeLine(line.slice(1));
                            if (content) deletions.add(content);
                        }
                    }
                }
            }

            changesByFile.set(file.filename, { additions, deletions });
        }

        return changesByFile;
    }

    normalizeLine(line: string): string {
        return line.trim().replace(/\s+/g, ' ');
    }

    extractChangesFromPatch(diffContent: string): Map<string, ExtractedChanges> {
        const changesByFile = new Map<string, ExtractedChanges>();
        const patches = Diff.parsePatch(diffContent);

        for (const patch of patches) {
            const additions = new Set<string>();
            const deletions = new Set<string>();

            // Get filename (prefer newFileName for new files, fallback to oldFileName)
            const filename = (patch.newFileName || patch.oldFileName || 'unknown')
                .replace(/^[ab]\//, ''); // Remove a/ or b/ prefix

            for (const hunk of patch.hunks) {
                for (const line of hunk.lines) {
                    if (line.length > 1) { // Skip empty lines
                        const content = this.normalizeLine(line.slice(1)); // Remove +/- prefix
                        if (content) {
                            if (line[0] === '+') {
                                additions.add(content);
                            } else if (line[0] === '-') {
                                deletions.add(content);
                            }
                        }
                    }
                }
            }

            changesByFile.set(filename, { additions, deletions });
        }

        return changesByFile;
    }

    compareLocalDiffsToPR(
        localDiffs: UnifiedDiffBlock[],
        prChangesByFile: Map<string, ExtractedChanges>
    ): PrMetricSummary {
        let totalLocalAdditions = 0;
        let totalLocalDeletions = 0;
        let totalPRAdditions = 0;
        let totalPRDeletions = 0;
        let additionsInPR = 0;
        let deletionsInPR = 0;

        for (const [prFilename, prChanges] of prChangesByFile) {

            // Count total PR changes and how many exist in the combined local changes
            totalPRAdditions += prChanges.additions.size;
            totalPRDeletions += prChanges.deletions.size;

            const relevantLocalDiffs = localDiffs.filter(localDiff => {
                // local filePath ends with PR filename (normalize slashes)
                if (localDiff.filePath) {
                    const normalizedLocal = localDiff.filePath.replace(/\\/g, '/');
                    const normalizedPR = prFilename.replace(/\\/g, '/');
                    if (normalizedLocal.endsWith(normalizedPR)) {
                        return true;
                    }
                }
                // if this was created by a prompt, it has a synthetic name and no path
                if (!localDiff.filePath && this.isSyntheticFile(localDiff.fileName)) return true; 
                // exact match 
                return localDiff.fileName === prFilename; 
            });

            // Aggregate all local changes for this PR file
            const allLocalAdditions = new Set<string>();
            const allLocalDeletions = new Set<string>();

            for (const localDiff of relevantLocalDiffs) {
                const localChangesByFile = this.extractChangesFromPatch(localDiff.diffBlock);
                const fileChanges = localChangesByFile.get(localDiff.fileName) || {
                    additions: new Set<string>(),
                    deletions: new Set<string>()
                };

                fileChanges.additions.forEach(add => {
                    allLocalAdditions.add(add);
                    totalLocalAdditions++;
                });
                fileChanges.deletions.forEach(del => {
                    allLocalDeletions.add(del);
                    totalLocalDeletions++;
                });
            }

            for (const addition of prChanges.additions) {
                if (allLocalAdditions.has(addition)) {
                    additionsInPR++;
                }
            }

            for (const deletion of prChanges.deletions) {
                if (allLocalDeletions.has(deletion)) {
                    deletionsInPR++;
                }
            }

        }
        const resultMetrics: PrMetricSummary = {
            changedFiles: prChangesByFile.size,
            localAdditions: totalLocalAdditions,
            localDeletions: totalLocalDeletions,
            prAdditions: totalPRAdditions,
            prDeletions: totalPRDeletions,
            prAdditionsFromLocal: additionsInPR,
            prDeletionsFromLocal: deletionsInPR,
            additionPercentage: totalPRAdditions > 0 ? (additionsInPR / totalPRAdditions) * 100 : 0,
            deletionPercentage: totalPRDeletions > 0 ? (deletionsInPR / totalPRDeletions) * 100 : 0
        };
        return resultMetrics;
    }

    private isSyntheticFile(filename: string): boolean {
        // Detect synthetic filenames like "response_1.go", "file_2.py", etc.
        return /^(response_|file_)\d+\./.test(filename);
    }


    async loadLocalPrs(userId: string, startDate: Date, endDate: Date): Promise<UnifiedDiffBlock[]> {
        let blocks = [];
        const checkedEnd: Date = (!endDate) ? new Date() : endDate; 
        const checkedStart: Date = (!startDate || startDate >= endDate) ? new Date(checkedEnd.getTime() - (21 * 24 * 60 * 60 * 1000)) : startDate; 

        const dataRecs = await this.evaluatorDb.getDataByDateRange(checkedStart, checkedEnd, userId, "response-complete");
        if (dataRecs) {
            for (const thisRec of dataRecs) {
                blocks.push(...thisRec.results.data.diff_blocks);
            }
        }
        return blocks;
    }
 
    /**
     * Calculates AI-related metrics for closed pull requests
     * @param evalEvent The evaluator service event containing previous GitHub PR data
     * @returns Evaluation result with calculated AI metrics
     */
    async evaluate(evalEvent: EvaluatorServiceEvent): Promise<EvaluatorResult> {
        logger.debug('Processing calculate-closedpr event');

        let results: EvaluatorResult = {
            status: "ok",
            message: "",
            next_events: []
        };

        // Extract previous GitHub PR data from context
        const previousData: EvaluatorsDataResults = evalEvent.context?.find(c => c.key === "previous")?.value;
        if (!previousData?.data || !previousData.data?.files) {
            results.message = "No previous PR data found. Skipping metrics calculation.";
            return Promise.resolve(results);
        }
        const userId: string = previousData.reference.user_id; // me = '485e2e34-c88e-46bf-a69f-fbe6eb989fb7' 
        const startDate = previousData.data?.earliest_date || Date.now();
        const closeDate = previousData.data?.close_date || Date.now();

        // get the PR changes directly from the database record
        const prData: EvaluatorData | null = await this.evaluatorDb.getData(previousData.reference.saved_data_id);
        if (!prData) {
            results.message = "Could not find record in database.  Skipping metrics calculation.";
            return Promise.resolve(results);
        }

        const localChanges: UnifiedDiffBlock[] = await this.loadLocalPrs(userId, startDate, closeDate);
        const prChangesByFile = this.extractPRChanges(prData);
        let prCompareResult = this.compareLocalDiffsToPR(localChanges, prChangesByFile);

        prCompareResult.source = previousData?.data.source; 
        prCompareResult.organization = previousData?.data.organization;
        prCompareResult.repository =  previousData?.data.repository;
        prCompareResult.prid =  previousData?.data.pr_id;

        // save this to the summary record in the analysis_results table
        try {
            const analyisEvents = new AnalysisResultsRepository(this.evaluatorDb);
            analyisEvents.upsertMetric(prCompareResult); 
        } catch (error) {
            logger.error(`Failed to update analysis results : ${error instanceof Error ? error.message : 'Unknown error'}`); 
        }

        results = {
            status: "ok",
            message: `Calculated AI metrics for PR ${prData.results.data.pr_id}`,
            userId: userId, 
            next_events: [],
            result: { key: "output", value: { metrics: prCompareResult } }
        };
        return Promise.resolve(results);
    }
}