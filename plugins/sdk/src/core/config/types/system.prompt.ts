export enum SystemPromptMode {
    OVERRIDE = 'OVERRIDE',
    PREPEND = 'PREPEND',
    APPEND = 'APPEND'
}

export interface SystemPrompt {
    content: string;
    mode: SystemPromptMode;
}
