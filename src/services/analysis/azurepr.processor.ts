import logger from "../../utils/logger";
import type { AnalysisProcessor } from "../../types/analysis.types";
import type { AnalysisDB } from "../../db";
import { container } from "tsyringe";
import { AzureDevOpsAnalyzer } from "./azurepr/azurepr.adoanalyzer";
import { MockAzureCmServer } from "./azurepr/azurepr.mock-adoanalyzer";
import { ClaudeAnalyzer } from "./azurepr/azurepr.claudeanalyzer";
import { MockClaudeAnalyzer } from "./azurepr/azurepr.mock-claudeanalyzer";
import { GenerativeComparer } from "./azurepr/azurepr.comparer";
import { ClaudeChangeAnalysis, FileLineChanges, ChangeMatchResult } from "./types";

export class AzurePrProcessor implements AnalysisProcessor {
    constructor(private analysisDb: AnalysisDB) {
    }

    displayPrSummary = (fileChanges: FileLineChanges[]) => {
        console.log('\n📊 PR Summary:');
        console.log('================');
        fileChanges.forEach(fileChange => {
            const totalLines = fileChange.addedLines.length + fileChange.deletedLines.length + fileChange.modifiedLines.length;
            console.log(`${fileChange.filePath} [${fileChange.changeType}] - ${totalLines} lines changed`);
        });
    };
    displayClaudeSummary = (changes: ClaudeChangeAnalysis[]) => {
        console.log('\n📊 Claude Summary:');
        console.log('================');
        changes.forEach(change => {
            console.log(`File: ${change.filePath}`);
            console.log(`Add/Edit/Delete: ${change.addedLineCount}/${change.modifiedLineCount}/${change.deletedLineCount}`);
        });
    };
    displaySummary = (results: ChangeMatchResult[], allFileChanges: FileLineChanges[]) => {
        console.log('\n🤖 AI Change Analysis:');
        console.log('=====================');

        // Summary statistics
        const totalChanges = results.length;
        const totalCharacters = results.reduce((sum, r) => sum + r.totalCharacters, 0);
        const totalMatched = results.reduce((sum, r) => sum + r.matchedCharacters, 0);
        const typeStats = results.reduce((acc, r) => {
            acc[r.aiChange.typeOfChange] = (acc[r.aiChange.typeOfChange] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // PR statistics
        const totalFiles = allFileChanges.length;
        const prStats = allFileChanges.reduce((acc, file) => {
            acc.added += file.addedLines.length;
            acc.modified += file.modifiedLines.length;
            acc.deleted += file.deletedLines.length;
            return acc;
        }, { added: 0, modified: 0, deleted: 0 });

        console.log(`Total Changes: ${totalChanges} | Characters: ${totalMatched}/${totalCharacters} (${totalCharacters > 0 ? (totalMatched / totalCharacters * 100).toFixed(1) : 0}%)`);
        console.log(`Types: ${Object.entries(typeStats).map(([type, count]) => `${type}:${count}`).join(', ')}`);
        console.log(`PR: ${totalFiles} files | Lines: +${prStats.added} ~${prStats.modified} -${prStats.deleted}`);
    };
    async processTask(analysisEventId: string, eventType: string, data: any, parameterData: string): Promise<void> {
        logger.info(`Processing Azure PR analysis - analysisEventId: ${analysisEventId}, ${eventType} ${data} parameterData: ${parameterData}`);

        // azure pr in database id: 3db94f16-7fad-4b93-b893-385f66061423
        // Use mock data for development/testing
        const useMockData = false || process.env.USE_MOCK_AZURE === 'true';
        const azureServer = useMockData ? new MockAzureCmServer() : new AzureDevOpsAnalyzer();
        const claudeParser = useMockData ? new MockClaudeAnalyzer() : container.resolve(ClaudeAnalyzer);
        const resultComparer = new GenerativeComparer();

        logger.debug(`Azure server initialized: ${useMockData ? 'Mock' : 'Live'}`, {
            server: azureServer.constructor.name,
            parser: claudeParser.constructor.name
        });

        const analysisEvent = await this.analysisDb.findById(analysisEventId);
        if (!analysisEvent) {
            throw new Error(`Analysis event not found with id: ${analysisEventId}`);
        }

        azureServer.readAnalysisEventRecord(JSON.stringify(analysisEvent.event_data), analysisEvent.user_id || '');
        const changedFiles = await azureServer.getChangedFiles();
        const allFileChanges = await azureServer.processChangedFiles(changedFiles);

        const eventCollection = await claudeParser.readEventChanges(analysisEvent!.user_id || '', analysisEvent!.created_at);
        const claudeChanges = claudeParser.scanClaudeChanges(eventCollection.postToolUseEvents);

        const generativeResults = resultComparer.compare(claudeChanges, allFileChanges);
 
        this.displayPrSummary(allFileChanges);
        this.displayClaudeSummary(claudeChanges);
        this.displaySummary(generativeResults, allFileChanges);
   }
}