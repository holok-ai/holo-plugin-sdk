import {injectable} from 'tsyringe';
import { IPrToGenerativeComparer } from '../interfaces';
import { ClaudeChangeAnalysis, FileLineChanges, ChangeMatchResult } from '../types';

const MATCH_CONFIDENCE = {
  HIGH_THRESHOLD: 50,
  PARTIAL_THRESHOLD: 20,
  WORD_MIN_LENGTH: 2,
  PARTIAL_MATCH_WEIGHT: 0.5
} as const;

@injectable()
export class GenerativeComparer implements IPrToGenerativeComparer {
  
  constructor() {}
  
  compare(claudeChanges: ClaudeChangeAnalysis[], allFileChanges: FileLineChanges[]): ChangeMatchResult[] {
    const results: ChangeMatchResult[] = [];

    claudeChanges.forEach(claudeChange => {
      // Process added lines 
      if (claudeChange.addedLineCount > 0) {
        const addedText = claudeChange.addedLines.join('\n');
        let totalMatchedChars = 0;
        const matchedFiles: string[] = [];
        const totalChars = addedText.length;

        allFileChanges.forEach(fileChange => {
          let fileMatches = 0;
          const relevantPrLines = [...fileChange.addedLines, ...fileChange.modifiedLines];
          const prChangeText = relevantPrLines.map(line => line.content).join('\n');
          
          if (prChangeText.trim()) {
            const matchedChars = this.calculateCharacterOverlap(addedText, prChangeText);
            
            if (matchedChars > 0) {
              fileMatches += matchedChars;
              if (!matchedFiles.includes(fileChange.filePath)) {
                matchedFiles.push(fileChange.filePath);
              }
            }
          }

          totalMatchedChars += fileMatches;
        });

        results.push({
          aiChange: { filePath: claudeChange.filePath, typeOfChange: 'generated', changedLines: addedText },
          matchedCharacters: totalMatchedChars,
          totalCharacters: totalChars,
          matchPercentage: totalChars > 0 ? (totalMatchedChars / totalChars) * 100 : 0,
          matchedInFiles: matchedFiles
        });
      }

      // Process modified lines 
      if (claudeChange.modifiedLineCount > 0) {
        const modifiedText = claudeChange.modifiedLines.join('\n');
        let totalMatchedChars = 0;
        const matchedFiles: string[] = [];
        const totalChars = modifiedText.length;

        allFileChanges.forEach(fileChange => {
          let fileMatches = 0;
          const relevantPrLines = [...fileChange.addedLines, ...fileChange.modifiedLines];
          const prChangeText = relevantPrLines.map(line => line.content).join('\n');
          
          if (prChangeText.trim()) {
            const matchedChars = this.calculateCharacterOverlap(modifiedText, prChangeText);
            
            if (matchedChars > 0) {
              fileMatches += matchedChars;
              if (!matchedFiles.includes(fileChange.filePath)) {
                matchedFiles.push(fileChange.filePath);
              }
            }
          }

          totalMatchedChars += fileMatches;
        });

        results.push({
          aiChange: { filePath: claudeChange.filePath, typeOfChange: 'generated', changedLines: modifiedText },
          matchedCharacters: totalMatchedChars,
          totalCharacters: totalChars,
          matchPercentage: totalChars > 0 ? (totalMatchedChars / totalChars) * 100 : 0,
          matchedInFiles: matchedFiles
        });
      }

      // Process deleted lines
      if (claudeChange.deletedLineCount > 0) {
        const deletedText = claudeChange.deletedLines.join('\n');
        let totalMatchedChars = 0;
        const matchedFiles: string[] = [];
        const totalChars = deletedText.length;

        allFileChanges.forEach(fileChange => {
          let fileMatches = 0;
          const relevantPrLines = fileChange.deletedLines;
          const prChangeText = relevantPrLines.map(line => line.content).join('\n');
          
          if (prChangeText.trim()) {
            const matchedChars = this.calculateCharacterOverlap(deletedText, prChangeText);
            
            if (matchedChars > 0) {
              fileMatches += matchedChars;
              if (!matchedFiles.includes(fileChange.filePath)) {
                matchedFiles.push(fileChange.filePath);
              }
            }
          }

          totalMatchedChars += fileMatches;
        });

        results.push({
          aiChange: { filePath: claudeChange.filePath, typeOfChange: 'deleted', changedLines: deletedText },
          matchedCharacters: totalMatchedChars,
          totalCharacters: totalChars,
          matchPercentage: totalChars > 0 ? (totalMatchedChars / totalChars) * 100 : 0,
          matchedInFiles: matchedFiles
        });
      }
    });

    return results;
  }

  private findLongestCommonSubstring(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    let maxLength = 0;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          maxLength = Math.max(maxLength, dp[i][j]);
        }
      }
    }

    return maxLength;
  }

  private calculateCharacterOverlap(aiChangeText: string, prChangeText: string): number {
    // Remove whitespace and normalize for comparison
    const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();
    
    const normalizedAi = normalizeText(aiChangeText);
    const normalizedPr = normalizeText(prChangeText);
    
    // Find longest common substring
    const commonLength = this.findLongestCommonSubstring(normalizedAi, normalizedPr);
    
    // Also check for partial matches by splitting into words and finding matches
    const aiWords = normalizedAi.split(' ').filter(w => w.length > MATCH_CONFIDENCE.WORD_MIN_LENGTH);
    const prWords = normalizedPr.split(' ').filter(w => w.length > MATCH_CONFIDENCE.WORD_MIN_LENGTH);
    
    let wordMatchChars = 0;
    aiWords.forEach(aiWord => {
      prWords.forEach(prWord => {
        if (aiWord === prWord) {
          wordMatchChars += aiWord.length;
        } else if (aiWord.includes(prWord) || prWord.includes(aiWord)) {
          // Partial word match
          wordMatchChars += Math.min(aiWord.length, prWord.length) * MATCH_CONFIDENCE.PARTIAL_MATCH_WEIGHT;
        }
      });
    });
    
    return Math.max(commonLength, wordMatchChars);
  }
}