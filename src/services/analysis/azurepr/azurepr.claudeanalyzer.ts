import { injectable } from 'tsyringe';
import { IClaudeAnalyzer } from '../interfaces';
import { PostToolUseEvent, EditToolResponse, ClaudeChangeAnalysis, ClaudeEventCollection, PreToolUseEvent } from '../types';
import { AnalysisDB } from '../../../db';

@injectable()
export class ClaudeAnalyzer implements IClaudeAnalyzer {

  constructor(private analysisDb: AnalysisDB) { }

  scanClaudeChanges(events: PostToolUseEvent[]): ClaudeChangeAnalysis[] {
    const results: ClaudeChangeAnalysis[] = [];

    events.forEach(event => {
      const editResponse = event.tool_response as EditToolResponse;
      if (editResponse.structuredPatch) {
        editResponse.structuredPatch.forEach(patch => {
          const analysis: ClaudeChangeAnalysis = {
            filePath: editResponse.filePath,
            addedLineCount: 0,
            addedLines: [],
            modifiedLineCount: 0,
            modifiedLines: [],
            deletedLineCount: 0,
            deletedLines: []
          };

          const lines = patch.lines;
          let i = 0;

          while (i < lines.length) {
            const currentLine = lines[i];

            if (currentLine.startsWith('-') && i + 1 < lines.length && lines[i + 1].startsWith('+')) {
              // Modified line: - followed by +
              analysis.modifiedLineCount++;
              analysis.modifiedLines.push(lines[i + 1].substring(1)); // Remove the '+' prefix
              i += 2; // Skip both lines
            } else if (currentLine.startsWith('+')) {
              // Added line
              analysis.addedLineCount++;
              analysis.addedLines.push(currentLine.substring(1)); // Remove the '+' prefix
              i++;
            } else if (currentLine.startsWith('-')) {
              // Deleted line
              analysis.deletedLineCount++;
              analysis.deletedLines.push(currentLine.substring(1)); // Remove the '-' prefix
              i++;
            } else {
              // Unchanged line, skip
              i++;
            }
          }

          results.push(analysis);
        });
      }
    });

    return results;
  }

  async readEventChanges(userId: string, prCompleteDate: Date): Promise<ClaudeEventCollection> {
    try {

      // Get AnalysisEvents from database for this user where created_at <= prCompleteDate
      const analysisEvents = await this.analysisDb.findByUserIdBeforeDate(userId, prCompleteDate);
      console.log(`Found ${analysisEvents.length} AnalysisEvents for user ${userId} before ${prCompleteDate.toISOString()}`);

      // Convert each analysisEvent.event_data to JSON and collect in allEvents array
      const allEvents: any[] = [];
      analysisEvents.forEach(analysisEvent => {
        if (analysisEvent.event_data) {
          // Parse the event_data JSON and add each event to allEvents
          const eventData = typeof analysisEvent.event_data === 'string'
            ? JSON.parse(analysisEvent.event_data)
            : analysisEvent.event_data;

          if (Array.isArray(eventData)) {
            const eventsWithData = eventData.map(event => ({
              ...event,
              id: analysisEvent.id,
              event_date: event.event_date ? new Date(event.event_date) : new Date()
            }));
            allEvents.push(...eventsWithData);
          } else {
            allEvents.push({
              ...eventData,
              id: analysisEvent.id,
              event_date: eventData.event_date ? new Date(eventData.event_date) : new Date()
            });
          }
        }
      });

      // Separate PreToolUse and PostToolUse events
      const preToolUseEvents: PreToolUseEvent[] = allEvents.filter(event =>
        event.hook_event_name === 'PreToolUse'
      );

      const postToolUseEvents: PostToolUseEvent[] = allEvents.filter(event =>
        event.hook_event_name === 'PostToolUse' &&
        (event.tool_name === 'Edit' || event.tool_name === 'MultiEdit')
      );

      console.log(`Processed ${preToolUseEvents.length} PreToolUse events and ${postToolUseEvents.length} Edit/MultiEdit PostToolUse events from ${allEvents.length} total events`);

      return new ClaudeEventCollection(postToolUseEvents, preToolUseEvents);

    } catch (error) {
      console.error('Error gathering Claude events for user :', error);
      return new ClaudeEventCollection();
    }
  }
}