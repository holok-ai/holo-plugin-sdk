import {createOpenAIRoutes} from "./openai.routes";
import express from "express";
import {createApiRoutes} from "./llm.routes";
import {createClaudeRoutes} from "./claude.routes";
import {createPerplexityRoutes} from "./perplexity.routes";

export function createRoutes(): express.Router {
    const router = express.Router();
    router.use('/', createApiRoutes());
    router.use('/openai/v1', createOpenAIRoutes());
    router.use('/claude/v1', createClaudeRoutes());
    router.use('/perplexity', createPerplexityRoutes());
    return router;
}
