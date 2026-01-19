import {
    BetaContentBlockParam,
    BetaMessageParam,
    BetaMessageStreamParams,
    BetaTool,
    BetaToolChoice,
    BetaToolUnion
} from '@anthropic-ai/sdk/resources/beta/messages/messages';

// Claude type aliases - export our own interfaces
export type ClaudeContentBlockParam = BetaContentBlockParam;
export type ClaudeTool = BetaTool;
export type ClaudeToolChoice = BetaToolChoice;
export type ClaudeToolUnion = BetaToolUnion;
export type ClaudeRequestMessage = BetaMessageParam;
export type ClaudeChatRequest = BetaMessageStreamParams;
