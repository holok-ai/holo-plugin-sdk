/** A tool definition exposed to the model. */
export interface HoloTool {
    name: string;
    description?: string;
    /** JSON Schema describing the tool's input parameters. */
    parameters?: Record<string, unknown>;
}

/**
 * Controls how the model selects tools.
 *
 * - `auto` — model decides whether to call a tool
 * - `none` — tool use disabled
 * - `required` — model must call at least one tool
 * - `specific` — model must call the tool identified by `name`
 */
export type HoloToolChoice =
    | { type: 'auto' }
    | { type: 'none' }
    | { type: 'required' }
    | { type: 'specific'; name: string };

/** A function call extracted from a model response. */
export interface HoloToolFunctionCall {
    name: string;
    arguments: Record<string, unknown>;
}

/**
 * Wrapper around {@link HoloToolFunctionCall} used in {@link HoloMessage.tool_calls}.
 * @see {@link HoloContentToolCall} for the content-block representation.
 */
export interface HoloToolCall {
    id?: string;
    type: 'function';
    function: HoloToolFunctionCall;
}
