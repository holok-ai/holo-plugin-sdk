import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {PerplexityController} from "../controllers/perplexity.controller";


export function createPerplexityRoutes(): express.Router {
    const openAIRouter = express.Router();
    const perplexityController: PerplexityController = container.resolve(PerplexityController);

    openAIRouter.post('/chat/completions', perplexityController.chatCompletions);
    openAIRouter.post('/models', perplexityController.models);
    return openAIRouter;
}
