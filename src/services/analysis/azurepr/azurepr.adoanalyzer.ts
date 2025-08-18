import { injectable } from 'tsyringe';
import dotenv from 'dotenv';
import { IPullRequestAnalyzer } from '../interfaces';
import { ChangedFile, FileLineChanges, AzurePullRequestResponse, AzureIterationsResponse, AzureChangesResponse, AzureFileContentResponse } from '../types';
import { VersionControlChangeType } from 'azure-devops-node-api/interfaces/GitInterfaces';

@injectable()
export class AzureDevOpsAnalyzer implements IPullRequestAnalyzer {

  organization!: string;
  project!: string;
  repository!: string;
  pullRequestId!: string;
  userId!: string;

  readonly authHeaders: { headers: { Authorization: string } };

  constructor() {
    dotenv.config();

    // Validate required environment variables
    const requiredEnv = ['AZURE_PAT'];
    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    this.authHeaders = {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${process.env.AZURE_PAT}`).toString('base64')}`,
      }
    };
  }

  async processChangedFiles(files: ChangedFile[]): Promise<FileLineChanges[]> {
    const allFileChanges: FileLineChanges[] = [];

    for (const file of files) {
      try {
        const lineChanges = await this.getFileLineChanges(file);
        allFileChanges.push(lineChanges);      
      } catch (err: any) {
        console.warn(`⚠️ Error processing ${file.filePath}: ${err.message}`);
      }
    }

    return allFileChanges;
  }

  readAnalysisEventRecord(notice: string, userId: string): void {
    try {
      const noticeJson = JSON.parse(notice);

      // Extract organization from baseUrl
      const baseUrl = noticeJson.resourceContainers?.project?.baseUrl;
      if (baseUrl) {
        let orgName: string;
        if (baseUrl.endsWith('/')) {
          // Get everything between the previous slash and the last one
          const withoutTrailingSlash = baseUrl.slice(0, -1);
          const lastSlashIndex = withoutTrailingSlash.lastIndexOf('/');
          orgName = withoutTrailingSlash.substring(lastSlashIndex + 1);
        } else {
          // Get everything after the last slash to the end
          const lastSlashIndex = baseUrl.lastIndexOf('/');
          orgName = baseUrl.substring(lastSlashIndex + 1);
        }
        this.organization = orgName;
      }

      this.project = noticeJson.resource?.repository?.project?.name || this.project;
      this.repository = noticeJson.resource?.repository?.id || this.repository;
      this.pullRequestId = noticeJson.resource?.pullRequestId || this.pullRequestId;
      this.userId = userId;

    } catch (error) {
      console.error('Error parsing PR notice:', error);
    }
  }

  async getChangedFiles(): Promise<ChangedFile[]> {
    try {
      // Step 1: Get Pull Request Details
      const prUrl = `https://dev.azure.com/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}/_apis/git/repositories/${this.repository}/pullRequests/${this.pullRequestId}?api-version=7.1`;
      const prResponse = await fetch(prUrl, this.authHeaders);

      if (!prResponse.ok) {
        throw new Error(`Failed to get PR details: HTTP ${prResponse.status}`);
      }

      const prData = await prResponse.json() as AzurePullRequestResponse;
      const baseCommit = prData.lastMergeTargetCommit?.commitId;
      const targetCommit = prData.lastMergeSourceCommit?.commitId;

      if (!baseCommit || !targetCommit) {
        throw new Error('Missing commit IDs in pull request response');
      }

      // Step 2: Get Pull Request Iterations
      const iterationsUrl = `https://dev.azure.com/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}/_apis/git/repositories/${this.repository}/pullRequests/${this.pullRequestId}/iterations?api-version=7.1`;
      const iterationsResponse = await fetch(iterationsUrl, this.authHeaders);

      if (!iterationsResponse.ok) {
        throw new Error(`Failed to get PR iterations: HTTP ${iterationsResponse.status}`);
      }

      const iterationsData = await iterationsResponse.json() as AzureIterationsResponse;

      if (!iterationsData?.value?.length) {
        throw new Error('No iterations found for pull request');
      }

      const latestIterationId = iterationsData.value[iterationsData.value.length - 1].id;

      // Step 3: Get Changed Files List
      const changesUrl = `https://dev.azure.com/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}/_apis/git/repositories/${this.repository}/pullRequests/${this.pullRequestId}/iterations/${latestIterationId}/changes?api-version=7.1&$top=2000&$compareTo=0`;
      const changesResponse = await fetch(changesUrl, this.authHeaders);

      if (!changesResponse.ok) {
        throw new Error(`Failed to get PR changes: HTTP ${changesResponse.status}`);
      }

      const changesData = await changesResponse.json() as AzureChangesResponse;

      const changedFiles = changesData?.changeEntries || [];
      const results: Array<{
        filePath: string;
        changeType: string;
        originalContent: string;
        lastContent: string;
      }> = [];

      // Step 4: Get File Content for each changed file
      for (const change of changedFiles) {
        const filePath = change.item?.path;

        if (!filePath || this.isBinaryFile(filePath)) {
          continue;
        }

        let originalContent = '';
        let lastContent = '';

        // Step 4a: Get Original File Content (base commit)
        if (change.changeType !== VersionControlChangeType.Add) { // 'add') {
          try {
            const originalUrl = `https://dev.azure.com/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}/_apis/git/repositories/${this.repository}/items?scopePath=${encodeURIComponent(filePath)}&versionDescriptor.versionType=commit&versionDescriptor.version=${baseCommit}&includeContent=true&api-version=7.1`;
            const originalResponse = await fetch(originalUrl, this.authHeaders);

            if (originalResponse.ok) {
              const originalData = await originalResponse.text() as AzureFileContentResponse;
              originalContent = originalData.content || '';
            }
          } catch (error: any) {
            console.warn(`Failed to get original content for ${filePath}: ${error.message}`);
          }
        }

        // Step 4b: Get Modified File Content (target commit)
        if (change.changeType !== VersionControlChangeType.Delete) { //  'delete') {
          try {
            const modifiedUrl = `https://dev.azure.com/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}/_apis/git/repositories/${this.repository}/items?scopePath=${encodeURIComponent(filePath)}&versionDescriptor.versionType=commit&versionDescriptor.version=${targetCommit}&includeContent=true&api-version=7.1`;
            const modifiedResponse = await fetch(modifiedUrl, this.authHeaders);

            if (modifiedResponse.ok) {
              const modifiedData = await modifiedResponse.text() as AzureFileContentResponse;
              lastContent = modifiedData.content || '';
            }
          } catch (error: any) {
            console.warn(`Failed to get modified content for ${filePath}: ${error.message}`);
          }
        }

        results.push({
          filePath,
          changeType: String(change.changeType),
          originalContent,
          lastContent
        });
      }

      return results;

    } catch (error: any) {
      console.error(`Failed to get changes in PR: ${error.message}`);
      throw error;
    }
  }

  private isBinaryFile(filePath: string): boolean {
    return /\.(png|jpg|jpeg|gif|bmp|ico|webp|zip|rar|7z|tar|gz|exe|dll|pdf|woff|woff2|ttf|eot|mp3|mp4|avi|mov)$/i.test(filePath);
  }


  private computeDiff(originalLines: string[], modifiedLines: string[]) {
    const m = originalLines.length;
    const n = modifiedLines.length;

    // LCS table
    const lcs = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (originalLines[i - 1] === modifiedLines[j - 1]) {
          lcs[i][j] = lcs[i - 1][j - 1] + 1;
        } else {
          lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
        }
      }
    }

    // Backtrack to find changes
    const changes: Array<{ type: 'add' | 'delete' | 'same', originalLine?: number, modifiedLine?: number, content: string }> = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
        changes.unshift({ type: 'same', originalLine: i, modifiedLine: j, content: originalLines[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
        changes.unshift({ type: 'add', modifiedLine: j, content: modifiedLines[j - 1] });
        j--;
      } else if (i > 0) {
        changes.unshift({ type: 'delete', originalLine: i, content: originalLines[i - 1] });
        i--;
      }
    }

    return changes;
  }

  private async getFileLineChanges(file: ChangedFile): Promise<FileLineChanges> {
    const result: FileLineChanges = {
      filePath: file.filePath,
      changeType: 'unknown',
      addedLines: [],
      deletedLines: [],
      modifiedLines: []
    };

    try {
      // Try to get the actual file content from both commits and generate our own diff
      let originalContent = file.originalContent;
      let modifiedContent = file.lastContent;

      const originalLines = originalContent ? originalContent.split('\n') : [];
      const modifiedLines = modifiedContent ? modifiedContent.split('\n') : [];

      // Determine change type
      if (originalLines.length === 0 && modifiedLines.length > 0) {
        result.changeType = 'add';
        // All lines are added
        modifiedLines.forEach((line, index) => {
          result.addedLines.push({
            lineNumber: index + 1,
            content: line,
            type: 'added'
          });
        });
      } else if (originalLines.length > 0 && modifiedLines.length === 0) {
        result.changeType = 'delete';
        // All lines are deleted
        originalLines.forEach((line, index) => {
          result.deletedLines.push({
            lineNumber: index + 1,
            content: line,
            type: 'deleted'
          });
        });
      } else {
        result.changeType = 'edit';

        // Use proper diff algorithm
        const changes = this.computeDiff(originalLines, modifiedLines);

        changes.forEach(change => {
          if (change.type === 'add') {
            result.addedLines.push({
              lineNumber: change.modifiedLine || 0,
              content: change.content,
              type: 'added'
            });
          } else if (change.type === 'delete') {
            result.deletedLines.push({
              lineNumber: change.originalLine || 0,
              content: change.content,
              type: 'deleted'
            });
          }
        });
      }

      return result;

    } catch (error: any) {
      console.warn(`Failed to get diff for ${file.filePath}:`, error.message);
      return result;
    }
  }
}