import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {ClaudeController} from "../controllers/claude.controller";


export function createClaudeRoutes(): express.Router {
    const openAIRouter = express.Router();
    const claudeController: ClaudeController = container.resolve(ClaudeController);

    openAIRouter.post('/messages', claudeController.messages);
    openAIRouter.post('/models', claudeController.models);
    return openAIRouter;
}
