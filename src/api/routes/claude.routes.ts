import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {ClaudeController} from "../controllers/claude.controller";


export function createOpenAIRoutes(): express.Router {
    const openAIRouter = express.Router();
    const openAIController: ClaudeController = container.resolve(ClaudeController);

    openAIRouter.post('/messages', openAIController.messages);
    openAIRouter.post('/models', openAIController.models);
    return openAIRouter;
}
