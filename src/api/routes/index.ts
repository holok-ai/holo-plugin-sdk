import {createOpenAIRoutes} from "./openai.routes";
import express from "express";
import {createApiRoutes} from "./llm.routes";

export function createRoutes(): express.Router {
    const router = express.Router();
    router.use('/api', createApiRoutes);
    router.use('/api/openai/v1', createOpenAIRoutes);
    return router;
}
