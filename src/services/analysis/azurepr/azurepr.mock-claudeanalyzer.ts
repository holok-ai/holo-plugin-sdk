import {injectable} from 'tsyringe';
import fs from 'fs-extra';
import path from 'path';
import { IClaudeAnalyzer } from '../interfaces';
import { PostToolUseEvent, PreToolUseEvent, ClaudeChangeAnalysis, ClaudeEventCollection } from '../types';

@injectable()
export class MockClaudeAnalyzer implements IClaudeAnalyzer {
  
  constructor() {}

  async parseClaudeHookLog(): Promise<PostToolUseEvent[]> {
    try {
      const sampleFile = path.join(__dirname, 'azurepr.mockclaudedata.json');
      const content = await fs.readFile(sampleFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Using fallback Claude events');
      return this.getFallbackEvents();
    }
  }

  scanClaudeChanges(events: PostToolUseEvent[]): ClaudeChangeAnalysis[] {
    return events.map(event => {
      const toolResponse = event.tool_response as any;
      return {
        filePath: toolResponse?.filePath || '/unknown/file.ts',
        addedLineCount: 3,
        addedLines: [
          'const [isLoading, setIsLoading] = useState(false);',
          '  setIsLoading(true);',
          '  if (response.ok) {'
        ],
        modifiedLineCount: 1,
        modifiedLines: [
          'return <form onSubmit={handleSubmit}>'
        ],
        deletedLineCount: 1,
        deletedLines: [
          'const oldValidation = true;'
        ]
      };
    });
  }

  async readEventChanges(userId: string, prCompleteDate: Date): Promise<ClaudeEventCollection> {
    try {
      console.log(`🔍 Mock: Looking for events for user ${userId} before ${prCompleteDate.toISOString()}`);
      
      const sampleFile = path.join(__dirname, '..', '..', '..', 'sample-data', 'claude-events.json');
      const content = await fs.readFile(sampleFile, 'utf-8');
      const events = JSON.parse(content);
      
      const postToolUseEvents: PostToolUseEvent[] = events
        .filter((event: any) => event.hook_event_name === 'PostToolUse')
        .map((event: any) => ({
          ...event,
          event_date: new Date(event.event_date)
        }));

      const preToolUseEvents: PreToolUseEvent[] = events
        .filter((event: any) => event.hook_event_name === 'PreToolUse')
        .map((event: any) => ({
          ...event,
          event_date: new Date(event.event_date)
        }));

      console.log(`📊 Mock: Found ${postToolUseEvents.length} PostToolUse and ${preToolUseEvents.length} PreToolUse events`);
      
      return new ClaudeEventCollection(postToolUseEvents, preToolUseEvents);
      
    } catch (error) {
      console.error('Error reading mock Claude events:', error);
      return new ClaudeEventCollection();
    }
  }

  private getFallbackEvents(): PostToolUseEvent[] {
    return [{
      id: 'fallback-1',
      session_id: 'fallback-session',
      transcript_path: '/fallback/path',
      cwd: '/project',
      hook_event_name: 'PostToolUse',
      tool_name: 'Edit',
      tool_input: {
        file_path: '/src/components/LoginForm.tsx',
        old_string: 'old code',
        new_string: 'new code'
      },
      tool_response: {
        filePath: '/src/components/LoginForm.tsx',
        structuredPatch: [{
          oldStart: 1,
          oldLines: 1,
          newStart: 1,
          newLines: 2,
          lines: ['-old code', '+new code', '+additional line']
        }]
      },
      event_date: new Date()
    }];
  }
}