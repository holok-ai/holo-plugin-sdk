import {injectable} from 'tsyringe';
import fs from 'fs-extra';
import path from 'path';
import { IPullRequestAnalyzer } from '../interfaces';
import { ChangedFile, FileLineChanges } from '../types';

@injectable()
export class MockAzureCmServer implements IPullRequestAnalyzer {
  private organization: string = 'mock-org';
  private project: string = 'mock-project';
  private repository: string = 'mock-repo-id';
  private pullRequestId: number = 1;
  private userId: string = 'mock-user';

  constructor() {}


  async getChangedFiles(): Promise<ChangedFile[]> {
    try {
      const sampleFile = path.join(__dirname, '..', '..', '..', 'sample-data', 'changed-files.json');
      const data = await fs.readFile(sampleFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Using fallback sample data for changed files');
      return [
        { filePath: '/src/components/LoginForm.tsx', changeType: 'edit', originalContent: '', lastContent:'' },
        { filePath: '/src/utils/api.ts', changeType: 'add', originalContent: '', lastContent:''  },
        { filePath: '/README.md', changeType: 'edit', originalContent: '', lastContent:''  }
      ];
    }
  }

  async processChangedFiles(files: ChangedFile[]): Promise<FileLineChanges[]> {
    try {
      const sampleFile = path.join(__dirname, '..', '..', '..', 'sample-data', 'file-line-changes.json');
      const data = await fs.readFile(sampleFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Using fallback sample data for file line changes');
      return files.map(file => ({
        filePath: file.filePath,
        changeType: file.changeType,
        addedLines: [
          { lineNumber: 10, content: 'const newFeature = true;', type: 'added' as const },
          { lineNumber: 11, content: 'console.log("Added new feature");', type: 'added' as const }
        ],
        deletedLines: [
          { lineNumber: 5, content: 'const oldCode = false;', type: 'deleted' as const }
        ],
        modifiedLines: [
          { lineNumber: 15, content: 'return updatedValue;', type: 'modified' as const }
        ]
      }));
    }
  }

  readAnalysisEventRecord(notice: string, userId: string): void {
    try {
      const noticeJson = JSON.parse(notice);
      this.organization = noticeJson.organization || 'mock-org';
      this.project = noticeJson.project || 'mock-project';
      this.repository = noticeJson.repository || 'mock-repo';
      this.pullRequestId = noticeJson.pullRequestId || 1;
      this.userId = userId;
      console.log(`📋 Mock: Parsed PR notice - Org: ${this.organization}, Repository: ${this.repository} Project: ${this.project}, PR: ${this.pullRequestId} userid: ${this.userId}`);
    } catch (error) {
      console.log('📋 Mock: Using default values for PR notice');
    }
  }

}