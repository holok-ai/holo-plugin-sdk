export const SystemPromptMode = {
    OVERRIDE: 'OVERRIDE',
    PREPEND: 'PREPEND',
    APPEND: 'APPEND'
} as const;

export type SystemPromptMode = typeof SystemPromptMode[keyof typeof SystemPromptMode];

export interface SystemPrompt {
    content: string;
    mode: SystemPromptMode;
}
