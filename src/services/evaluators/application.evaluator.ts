import { IEvaluator, EvaluatorEvent, EvaluatorResult } from '../../types/evaluator.types';
import { Evaluator } from '../../db/types';
import { spawn } from 'child_process';
import * as path from 'path';
import logger from '../../utils/logger';

export class ApplicationEvaluator implements IEvaluator {
    evaluatorId: string;
    handlesEventName: string;
    allowUserOverride: boolean;
    runType: string = "application";
    evaluatorName: string = "";
    private command: string;
    private args: string[];
    private env: Record<string, string>;
    private cwd: string;

    constructor(evaluator: Evaluator) {
        const config = evaluator.parameters?.action?.config;
        if (!config) {
            throw new Error('No config found for application evaluator');
        }
        
        this.evaluatorId = evaluator.id || '';
        this.handlesEventName = evaluator.evaluator_type || '';
        this.allowUserOverride = false;
        this.command = config.command || '';
        this.args = config.args || [];
        this.env = config.env || {};
        this.cwd = config.cwd || '';
        
        // Extract filename from args (typically the script filename is in the first arg)
        this.evaluatorName = this.extractFilename(this.args);
    }

    private extractFilename(args: string[]): string {
        const scriptExtensions = ['.py', '.js', '.ts', '.sh', '.go', '.bat', '.ps', '.exe'];
        
        // Look for a filename in the args (usually first arg contains the script path)
        for (const arg of args) {
            if (scriptExtensions.some(ext => arg.includes(ext))) {
                return path.basename(arg);
            }
        }
        // Fallback to first arg or empty string
        return args.length > 0 ? path.basename(args[0]) : "";
    }

    async evaluate(event: EvaluatorEvent): Promise<EvaluatorResult> {
        try {
            const rootAppDir = path.resolve(__dirname, '..', '..', '..', 'applications');

            // Repoint any args or cwd that use a path with {{APPDIR}}
            const adjustedArgs = this.args.map((arg: string) =>
                arg.replace(/\{\{appdir\}\}/gi, rootAppDir)
            );
            const adjustedCwd = this.cwd ? 
                this.cwd.replace(/\{\{appdir\}\}/gi, rootAppDir) : rootAppDir;
            const eventJson = JSON.stringify(event);
            logger.debug(`Running ${this.command} with args ${JSON.stringify(adjustedArgs)} \n\nJSON data: ${eventJson}`);

            const output = await new Promise<string>((resolve, reject) => {
                const proc = spawn(this.command, adjustedArgs, {
                    stdio: ["pipe", "pipe", "pipe"],
                    env: { ...process.env, ...this.env },
                    cwd: adjustedCwd
                });

                let stdout = "";
                let stderr = "";

                // Send event as JSON to stdin           
                logger.debug(`Sending to Python: ${eventJson.substring(0, 500)}...`);  // Log first 500 chars
                proc.stdin.write(eventJson);
                proc.stdin.end();

                proc.stdout.on("data", (data) => (stdout += data));
                proc.stderr.on("data", (data) => {
                    stderr += data;
                    logger.debug(`Python stderr: ${data}`);  // Log stderr for debugging
                });

                proc.on("close", (code) => {
                    if (code === 0) resolve(stdout);
                    else reject(new Error(stderr || `Exited with code ${code}`));
                });
            });

            // Check if output is valid JSON
            let value;
            try {
                value = JSON.parse(output);
            } catch {
                // If not JSON, wrap in an object
                value = { data: output };
            }

            // Python script returns EvaluatorResult structure
            return {
                status: value.status || "ok",
                message: value.message || "Application executed successfully",
                resultsFileName: value.resultsFileName,
                next_events: value.next_events || [],
                result: value.resultsFileName ? undefined : value.result
            };

        } catch (error) {
            return {
                status: "error",
                message: error instanceof Error ? error.message : String(error),
                next_events: []
            };
        }
    }
}