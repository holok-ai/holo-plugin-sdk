import {IPlugin} from "./base";

/**
 * Types of guards
 */
export enum GuardType {
    CONTENT_FILTER = 'content_filter',
    RATE_LIMITER = 'rate_limiter',
    TOKEN_LIMITER = 'token_limiter',
    PII_DETECTOR = 'pii_detector',
    PROMPT_INJECTION = 'prompt_injection',
    CUSTOM = 'custom'
}

/**
 * Guard rule condition for matching requests/responses
 */
export interface GuardCondition {
    /**
     * Field to check (e.g., 'content', 'headers.authorization', 'model')
     */
    field: string;

    /**
     * Operator for comparison
     */
    operator: 'equals' | 'contains' | 'regex' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';

    /**
     * Value(s) to compare against
     */
    value: string | number | boolean | string[] | number[];

    /**
     * Case sensitivity for string comparisons
     */
    caseSensitive?: boolean;

    /**
     * Negate the condition
     */
    negate?: boolean;
}

/**
 * Guard rule definition
 */
export interface GuardRule {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: 'allow' | 'block' | 'redact' | 'warn';

    /**
     * Conditions that must be met for this rule to apply
     * If multiple conditions, all must match (AND logic)
     */
    conditions?: GuardCondition[];

    /**
     * Logical operator for multiple conditions
     */
    conditionOperator?: 'AND' | 'OR';
}

/**
 * Details about a guard rule violation
 */
export interface GuardViolation {
    /**
     * ID of the rule that was violated
     */
    rule: string;

    /**
     * Severity of the violation
     */
    severity: 'low' | 'medium' | 'high' | 'critical';

    /**
     * Human-readable message about the violation
     */
    message: string;

    /**
     * Field/location where violation occurred
     */
    field?: string;

    /**
     * The value that caused the violation (for debugging)
     */
    offendingValue?: string | number | boolean;

    /**
     * Suggested remediation action
     */
    remediation?: string;
}

/**
 * Guard processing metadata
 */
export interface GuardMetadata {
    /**
     * Time taken to process in milliseconds
     */
    processingTimeMs?: number;

    /**
     * Number of rules evaluated
     */
    rulesEvaluated?: number;

    /**
     * Guard plugin that performed the validation
     */
    guardPlugin?: string;

    /**
     * Additional plugin-specific metadata
     */
    [key: string]: string | number | boolean | undefined;
}

/**
 * Result of guard validation
 */
export interface GuardResult {
    passed: boolean;
    violations?: GuardViolation[];

    /**
     * Content that was redacted/sanitized (if action was 'redact')
     * Contains the sanitized version of the original content
     */
    redactedContent?: string | object;

    /**
     * Processing metadata
     */
    metadata?: GuardMetadata;
    errors?: string[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimiting {
    /**
     * Max requests per time window
     */
    maxRequests: number;

    /**
     * Time window in seconds
     */
    windowSeconds: number;

    /**
     * Rate limit per user or global
     */
    scope: 'user' | 'global' | 'ip';
}

/**
 * Custom pattern for PII detection
 */
export interface CustomPattern {
    name: string;
    pattern: string;
    flags?: string;
}

/**
 * PII detection settings
 */
export interface PIIDetection {
    /**
     * Types of PII to detect
     */
    detectTypes: Array<'email' | 'phone' | 'ssn' | 'credit_card' | 'ip_address' | 'custom'>;

    /**
     * Custom regex patterns for PII detection
     */
    customPatterns?: CustomPattern[];

    /**
     * Action when PII is detected
     */
    action: 'block' | 'redact' | 'warn';
}

/**
 * Content filtering settings
 */
export interface ContentFiltering {
    /**
     * Blocked keywords/phrases
     */
    blockedTerms?: string[];

    /**
     * Allowed domains for URLs
     */
    allowedDomains?: string[];

    /**
     * Maximum content length
     */
    maxContentLength?: number;
}

/**
 * Configuration for guard plugins
 */
export interface GuardConfig {
    enabled: boolean;
    rules: GuardRule[];
    mode: 'blocking' | 'monitoring';

    /**
     * Rate limiting configuration (if applicable)
     */
    rateLimiting?: RateLimiting;

    /**
     * PII detection settings (if applicable)
     */
    piiDetection?: PIIDetection;

    /**
     * Content filtering settings (if applicable)
     */
    contentFiltering?: ContentFiltering;
}

/**
 * Guard plugin interface for request/response validation and security.
 * @template TRequest The type of requests validated by this guard.
 * @template TResponse The type of responses validated by this guard.
 *
 * @example
 * ```typescript
 * class ContentFilterPlugin
 *   extends BasePlugin
 *   implements IGuardPlugin<unknown, unknown>
 * {
 *   async validateRequest(request: unknown): Promise<GuardResult> {
 *     const violations = await this.checkContent(request);
 *     return {
 *       passed: violations.length === 0,
 *       violations
 *     };
 *   }
 *
 *   async validateResponse(response: unknown): Promise<GuardResult> {
 *     return { passed: true };
 *   }
 *
 *   getGuardType(): GuardType {
 *     return GuardType.CONTENT_FILTER;
 *   }
 *
 *   getRules(): GuardRule[] {
 *     return this.currentRules;
 *   }
 *
 *   async configure(config: Partial<GuardConfig>): Promise<void> {
 *     Object.assign(this.config, config);
 *   }
 * }
 * ```
 */
export interface IGuardPlugin<TRequest = unknown, TResponse = unknown> extends IPlugin {
    /**
     * Validate an incoming request.
     * @param request The request to validate (typed per guard).
     * @returns Validation result with pass/fail and violations.
     */
    validateRequest(request: TRequest): Promise<GuardResult>;

    /**
     * Validate an outgoing response.
     * @param response The response to validate (typed per guard).
     * @returns Validation result with pass/fail and violations.
     */
    validateResponse(response: TResponse): Promise<GuardResult>;

    /**
     * Get the type of guard.
     * @returns The guard type.
     */
    getGuardType(): GuardType;

    /**
     * Get configured rules.
     * @returns Array of guard rules.
     */
    getRules(): GuardRule[];

    /**
     * Configure the guard. Implementations may merge with existing config.
     * @param config Guard configuration (partial updates allowed).
     */
    configure(config: Partial<GuardConfig>): Promise<void>;
}

export const GuardResultSchema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
        "passed": {
            "type": "boolean"
        },
        "errors": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": ["passed"],
    "if": {
        "properties": {"passed": {"const": false}}
    },
    "then": {
        "required": ["errors"],
        "properties": {
            "errors": {
                "minItems": 1
            }
        }
    },
    "else": {
        "properties": {
            "errors": false
        }
    },
    "additionalProperties": false
};
