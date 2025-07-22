import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {LLMController} from "../controllers/llm.controller";

export function createApiRoutes(): express.Router {
    const apiRouter = express.Router();
    const llmController: LLMController = container.resolve('LLMController');

    apiRouter.post('/generate', llmController.generate);
    apiRouter.post('/chat', llmController.chat);
    return apiRouter;
}
