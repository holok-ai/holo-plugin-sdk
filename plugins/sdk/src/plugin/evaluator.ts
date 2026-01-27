import {IPlugin} from "./base";

/**
 * Types of evaluation metrics
 */
export interface EvaluationMetric {
    /**
     * Stable identifier used as the key in EvaluationResult.metrics.
     * If omitted, `name` MUST be used as the key.
     */
    id?: string;

    /**
     * Human-readable metric name (may be shown in UIs, logs, etc.).
     */
    name: string;

    /**
     * What this metric measures and how to interpret it.
     */
    description: string;

    /**
     * Optional unit (e.g. "probability", "score", "%", "tokens").
     */
    unit?: string;

    /**
     * Expected numeric range for this metric.
     */
    range?: {
        min: number;
        max: number;
    };
}

/**
 * Result of an evaluation
 */
/**
 * Issue found during evaluation
 */
export interface EvaluationIssue {
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
}

/**
 * Detailed evaluation breakdown
 */
export interface EvaluationDetails {
    categoryScores?: Record<string, number>;
    issues?: EvaluationIssue[];
    suggestions?: string[];
    rawOutput?: string;
    evaluationMethod?: string;
    confidence?: number;
}

export interface EvaluationResult {
    /**
     * Optional overall score, typically an aggregate over metrics.
     */
    score?: number;

    /**
     * Indicates whether the evaluated output is considered acceptable
     * according to the evaluator's criteria and configuration.
     */
    passed: boolean;

    /**
     * Per-metric scores keyed by metric id (or name if id is not provided).
     */
    metrics: Record<string, number>;

    /**
     * Optional human-readable feedback or explanation.
     */
    feedback?: string;

    /**
     * Additional evaluation details
     */
    details?: {
        /**
         * Detailed breakdown by evaluation category
         */
        categoryScores?: Record<string, number>;

        /**
         * Specific issues found during evaluation
         */
        issues?: Array<{
            category: string;
            severity: 'low' | 'medium' | 'high';
            description: string;
            location?: string;
        }>;

        /**
         * Suggestions for improvement
         */
        suggestions?: string[];

        /**
         * Raw model output if using LLM-based evaluation
         */
        rawOutput?: string;

        /**
         * Evaluation model/method used
         */
        evaluationMethod?: string;

        /**
         * Confidence score for the evaluation
         */
        confidence?: number;
    };

    /**
     * Evaluation timestamp (ms since epoch).
     */
    timestamp: number;
}

/**
 * Model-based evaluation settings
 */
export interface ModelEvaluation {
    /**
     * Model to use for evaluation
     */
    model: string;

    /**
     * Temperature for model sampling
     */
    temperature?: number;

    /**
     * Custom evaluation prompt template
     */
    promptTemplate?: string;

    /**
     * Number of evaluation samples to generate
     */
    numSamples?: number;
}

/**
 * Rule-based evaluation settings
 */
export interface RuleBasedEvaluation {
    /**
     * Maximum response length
     */
    maxResponseLength?: number;

    /**
     * Minimum response length
     */
    minResponseLength?: number;

    /**
     * Required keywords/phrases in response
     */
    requiredKeywords?: string[];

    /**
     * Prohibited keywords/phrases in response
     */
    prohibitedKeywords?: string[];

    /**
     * Check for factual consistency
     */
    checkFactualConsistency?: boolean;

    /**
     * Check for harmful content
     */
    checkHarmfulContent?: boolean;
}

/**
 * Configuration for evaluator plugins
 */
export interface EvaluatorConfig {
    /**
     * Whether this evaluator is enabled.
     */
    enabled: boolean;

    /**
     * Per-metric thresholds. Keys must match metric id or name.
     * Typically interpreted as minimum acceptable scores.
     */
    thresholds?: Record<string, number>;

    /**
     * Per-metric weights used to compute the overall score.
     */
    weights?: Record<string, number>;

    /**
     * Model-based evaluation settings (if using LLM for evaluation)
     */
    modelEvaluation?: ModelEvaluation;

    /**
     * Rule-based evaluation settings
     */
    ruleBasedEvaluation?: RuleBasedEvaluation;
}

/**
 * Evaluator plugin interface for LLM output evaluation
 *
 * @example
 * ```typescript
 * class QualityEvaluatorPlugin
 *   extends BasePlugin
 *   implements IEvaluatorPlugin<unknown, unknown>
 * {
 *   async evaluate(input: unknown, output: unknown): Promise<EvaluationResult> {
 *     const scores = await this.calculateScores(input, output);
 *     return {
 *       passed: scores.quality > 0.7,
 *       score: scores.overall,
 *       metrics: scores,
 *       timestamp: Date.now()
 *     };
 *   }
 *
 *   getMetrics(): EvaluationMetric[] {
 *     return [
 *       { name: 'quality', description: 'Overall quality score', range: { min: 0, max: 1 } },
 *       { name: 'relevance', description: 'Relevance to input', range: { min: 0, max: 1 } }
 *     ];
 *   }
 * }
 * ```
 */
export interface IEvaluatorPlugin<TInput = unknown, TOutput = unknown> extends IPlugin {
    /**
     * Evaluate LLM output against input.
     * @param input The original input/prompt (typed per plugin).
     * @param output The LLM output to evaluate (typed per plugin).
     * @returns Evaluation result with scores and metrics.
     */
    evaluate(input: TInput, output: TOutput): Promise<EvaluationResult>;

    /**
     * Get available evaluation metrics.
     * @returns Array of evaluation metrics.
     */
    getMetrics(): EvaluationMetric[];

    /**
     * Configure the evaluator. Implementations may merge with existing config.
     * @param config Evaluator configuration (partial updates allowed).
     */
    configure(config: Partial<EvaluatorConfig>): Promise<void>;

    /**
     * Batch evaluate multiple input/output pairs.
     * @param pairs Array of input/output pairs.
     * @returns Array of evaluation results (same order as input pairs).
     */
    batchEvaluate?(pairs: Array<{ input: TInput; output: TOutput }>): Promise<EvaluationResult[]>;
}