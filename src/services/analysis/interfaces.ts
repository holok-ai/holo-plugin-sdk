import { ChangedFile, FileLineChanges, PostToolUseEvent, ClaudeChangeAnalysis, ChangeMatchResult, ClaudeEventCollection } from './types';

export interface IPullRequestAnalyzer {
  getChangedFiles(): Promise<ChangedFile[]>;
  processChangedFiles(files: ChangedFile[]): Promise<FileLineChanges[]>;
  readAnalysisEventRecord(notice: string, userId: string): void;
}

export interface IClaudeAnalyzer {
  scanClaudeChanges(events: PostToolUseEvent[]): ClaudeChangeAnalysis[];
  readEventChanges(userId: string, prCompleteDate: Date): Promise<ClaudeEventCollection>;
}

export interface IPrToGenerativeComparer {
  compare(claudeChanges: ClaudeChangeAnalysis[], allFileChanges: FileLineChanges[]): ChangeMatchResult[];
}