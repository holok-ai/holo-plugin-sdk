import {InternalEvaluatorBase} from './internal.base';
import {AuditServiceEvent, EvaluatorResult} from '../../types';
import logger from '../../utils/logger';
import {ProviderResponse} from "@holokai/types/entities";

class CodeBlock {
    language!: string;
    block!: string;
}

interface UnifiedDiffBlock {
    language: string;
    tool: string,
    originalBlock: string;
    diffBlock: string;
    filePath: string,
    fileName: string;
}

export class ResponseCompleteEvaluator extends InternalEvaluatorBase {
    readonly evaluatorId = "";
    readonly handlesEventName = 'response-complete';
    readonly evaluatorName = 'response-complete';

    /**
     * Converts code blocks to unified diff format for version control visualization
     * @param codeBlocks Array of extracted code blocks from LLM response
     * @returns Array of unified diff blocks formatted as new file additions
     */
    createUniDiff(codeBlocks: CodeBlock[]): UnifiedDiffBlock[] {
        const diffBlocks: UnifiedDiffBlock[] = [];

        for (let index = 0; index < codeBlocks.length; index++) {
            const codeBlock = codeBlocks[index];
            const extension = codeBlock.language || 'txt';
            const filename = `response_${index + 1}.${extension}`;

            let lines = codeBlock.block.split('\n');
            if (lines.length > 0 && lines[0] === '') {
                lines.shift();
            }

            while (lines.length > 0 && lines[lines.length - 1] === '') {
                lines.pop();
            }

            // Build unified diff format for a new file
            const diffLines: string[] = [];
            diffLines.push(`diff --git a/${filename} b/${filename}`);
            diffLines.push(`new file mode 100644`);
            diffLines.push(`index 0000000..0000000`);
            diffLines.push(`--- /dev/null`);
            diffLines.push(`+++ b/${filename}`);
            diffLines.push(`@@ -0,0 +1,${lines.length} @@`);
            lines.forEach(line => {
                diffLines.push(`+${line}`);
            });

            const diffBlock: UnifiedDiffBlock = {
                language: 'diff', // -- Set to 'diff' for proper syntax highlighting
                tool: "text",
                originalBlock: codeBlock.block,
                diffBlock: diffLines.join('\n'),
                filePath: filename,
                fileName: filename
            };
            diffBlocks.push(diffBlock);
        }

        return diffBlocks;
    }

    /**
     * Extracts code blocks from markdown-style triple backtick notation
     * @param textBody Raw text content to parse for code blocks
     * @returns Array of code blocks with language and content
     */
    extractCodeBlocks(textBody: string): CodeBlock[] {
        let blocks: CodeBlock[] = [];

        // Find all Regex to match code blocks with optional language
        const regex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
        const matches = textBody.matchAll(regex);

        for (const match of matches) {
            const language = match[1] || ''; // Language identifier (if present)
            const codeContent = match[2];

            const codeBlock: CodeBlock = {
                language: language,
                block: codeContent
            };
            blocks.push(codeBlock);
        }

        return blocks;
    }

    /**
     * Extracts diff blocks from an Anthropic post tool event
     * @param responseRaw JSONB object from database containing tool use information
     * @returns Array of unified diff blocks (empty if invalid data)
     */
    extractAnthropicDiffBlocks(responseRaw: Record<string, any>): UnifiedDiffBlock[] {
        const results: UnifiedDiffBlock[] = [];

        // Validation checks
        if (!responseRaw ||
            responseRaw.hook_event_name !== "PostToolUse" ||
            !responseRaw.tool_name ||
            (responseRaw.tool_name !== "Edit" && responseRaw.tool_name !== "MultiEdit") ||
            !responseRaw.tool_response?.structuredPatch ||
            !Array.isArray(responseRaw.tool_response.structuredPatch) ||
            responseRaw.tool_response.structuredPatch.length === 0) {
            return results; // Skip invalid records
        }

        const filePath = responseRaw.tool_response.filePath;
        if (!filePath) return results; // Skip if no file path

        const filename = filePath.split(/[/\\]/).pop() || 'unknown';

        // Build unified diff
        const diffLines: string[] = [
            `diff --git a/${filename} b/${filename}`,
            `index 0000000..0000000 100644`,
            `--- a/${filename}`,
            `+++ b/${filename}`
        ];

        // Add each patch hunk
        for (const patch of responseRaw.tool_response.structuredPatch) {
            // Add hunk header
            diffLines.push(
                `@@ -${patch.oldStart},${patch.oldLines} +${patch.newStart},${patch.newLines} @@`
            );

            // Add the lines (they already have proper +/- prefixes)
            diffLines.push(...patch.lines);
        }

        // Get original file content if available
        const originalContent = responseRaw.tool_response.originalFileContents ||
            responseRaw.tool_response.originalFile ||
            '';

        results.push({
            language: 'diff',  // Always 'diff' for unified diff format
            tool: responseRaw.tool_name,
            originalBlock: originalContent,
            diffBlock: diffLines.join('\n'),
            filePath: filePath,
            fileName: filename
        });

        return results;
    }

    /**
     * Main evaluation method that processes LLM response completion events
     * Extracts code blocks from both response text and tool usage, converts to diff format
     * @param auditEvent The audit service event containing LLM response data
     * @returns Evaluation result with unified diff blocks for code visualization
     */
    async evaluate(auditEvent: AuditServiceEvent): Promise<EvaluatorResult> {
        let llmResponse: ProviderResponse | null = null;
        if (auditEvent.context) {
            llmResponse = auditEvent.context.find(c => c.key === "llm_responses")?.value as any;
        }
        const userId = llmResponse?.user_id || '';

        let results: EvaluatorResult = {
            status: "ok",
            message: "",
            userId: userId,
            next_events: []
        };

        if (!userId) {
            results.message = "User id not found. Skipping llm response processing. ";
            return Promise.resolve(results);
        }

        let diffBlocks: UnifiedDiffBlock[] = [];
        if (llmResponse?.response) {
            const codeBlocks: CodeBlock[] = this.extractCodeBlocks(llmResponse?.response || '');
            if (codeBlocks.length > 0) {
                diffBlocks = this.createUniDiff(codeBlocks);
            }
        }
        if (llmResponse?.metadata?.response_raw) {
            const anthroDiffBlocks: UnifiedDiffBlock[] = this.extractAnthropicDiffBlocks(llmResponse.metadata.response_raw);
            if (anthroDiffBlocks.length > 0) {
                diffBlocks = [...diffBlocks, ...anthroDiffBlocks];
            }
        }

        logger.debug(`DiffBlocks summary:`, diffBlocks.map(d => ({
            language: d.language,
            filename: d.fileName,
            originalBlockLength: d.originalBlock.length,
            diffBlockLines: d.diffBlock.split('\n').length
        })));

        results = {
            status: "ok",
            message: "",
            userId: userId,
            next_events: [],
            result: {key: "output", value: {diff_blocks: diffBlocks}}
        };

        return Promise.resolve(results);
    }
}