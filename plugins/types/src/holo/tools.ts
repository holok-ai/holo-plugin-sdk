export interface HoloTool {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
}

export type HoloToolChoice =
    | { type: 'auto' }
    | { type: 'none' }
    | { type: 'required' }
    | { type: 'specific'; name: string };

export interface HoloToolFunctionCall {
    name: string;
    arguments: Record<string, unknown>;
}

export interface HoloToolCall {
    id?: string;
    type: 'function';
    function: HoloToolFunctionCall;
}
