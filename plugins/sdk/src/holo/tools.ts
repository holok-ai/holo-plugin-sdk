// ---------- Tool definitions ----------
export interface HoloTool {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>; // JSON Schema object (optional)
}

export type HoloToolChoice =
    | { type: 'auto' }
    | { type: 'none' }
    | { type: 'required' }
    | { type: 'specific'; name: string }; // Specific tool to use


// ---------- Tool calling (portable) ----------
export interface HoloToolFunctionCall {
    name: string;
    arguments: Record<string, unknown>;   // JSON-serializable
}

export interface HoloToolCall {
    id?: string;                          // Assigned by the model/provider
    type: 'function';
    function: HoloToolFunctionCall;
}