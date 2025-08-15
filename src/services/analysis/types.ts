// Import Azure DevOps types from official Microsoft package
import {
  GitPullRequest,
  GitPullRequestIteration,
  GitPullRequestIterationChanges,
  GitItem
} from 'azure-devops-node-api/interfaces/GitInterfaces';

// Simplified response types for our specific API calls
export type AzurePullRequestResponse = GitPullRequest;
export type AzureIterationsResponse = { value: GitPullRequestIteration[]; count: number };
export type AzureChangesResponse = GitPullRequestIterationChanges;
export type AzureFileContentResponse = GitItem;

// Re-export commonly used types for convenience
export {
  GitPullRequest,
  GitPullRequestIteration,
  GitPullRequestIterationChanges,
  GitItem
} from 'azure-devops-node-api/interfaces/GitInterfaces';

export interface ChangedFile {
  filePath: string;
  changeType: string;
  originalContent: string;
  lastContent: string;
}

export interface LineChange {
  lineNumber: number;
  content: string;
  type: 'added' | 'deleted' | 'modified';
}

export interface FileLineChanges {
  filePath: string;
  changeType: string;
  addedLines: LineChange[];
  deletedLines: LineChange[];
  modifiedLines: LineChange[];
}


// Additional analysis types
export interface EditToolInput {
  file_path: string;
  old_string: string;
  new_string: string;
}

export interface EditToolResponse {
  filePath: string;
  oldString: string;
  newString: string;
  originalFile: string;
  structuredPatch: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
  userModified: boolean;
  replaceAll: boolean;
}

export interface ReadToolInput {
  file_path: string;
}

export interface ReadToolResponse {
  type: string;
  file: {
    filePath: string;
    content: string;
    numLines: number;
    startLine: number;
    totalLines: number;
  };
}

export interface LSToolInput {
  path: string;
}

export interface LSToolResponse {
  [key: string]: any;
}

export type ToolInput = EditToolInput | ReadToolInput | LSToolInput | { [key: string]: any };
export type ToolResponse = EditToolResponse | ReadToolResponse | LSToolResponse | string | { [key: string]: any };

export interface PreToolUseEvent {
  id: string;
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: string | null;
  tool_input: ToolInput;
  user_message: string;
  event_date: Date;
}

export interface PostToolUseEvent {
  id: string;
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: ToolInput;
  tool_response: ToolResponse;
  event_date: Date;
}

export interface ClaudeChangeAnalysis {
  filePath: string;
  addedLineCount: number;
  addedLines: string[];
  modifiedLineCount: number;
  modifiedLines: string[];
  deletedLineCount: number;
  deletedLines: string[];
}

export interface AiChange {
  filePath: string;
  typeOfChange: string;
  changedLines: string;
}

export interface ChangeMatchResult {
  aiChange: AiChange;
  matchedCharacters: number;
  totalCharacters: number;
  matchPercentage: number;
  matchedInFiles: string[];
}

export class ClaudeEventCollection {
  postToolUseEvents: PostToolUseEvent[];
  preToolUseEvents: PreToolUseEvent[];

  constructor(postEvents: PostToolUseEvent[] = [], preEvents: PreToolUseEvent[] = []) {
    this.postToolUseEvents = postEvents;
    this.preToolUseEvents = preEvents;
  }

  getTotalEventCount(): number {
    return this.postToolUseEvents.length + this.preToolUseEvents.length;
  }

  getEditEvents(): PostToolUseEvent[] {
    return this.postToolUseEvents.filter(event =>
      event.tool_name === 'Edit' || event.tool_name === 'MultiEdit'
    );
  }

  getUserPrompts(): PreToolUseEvent[] {
    return this.preToolUseEvents.filter(event => event.tool_name === null);
  }
}