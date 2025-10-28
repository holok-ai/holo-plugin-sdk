import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {OpenAIController} from "../controllers/openai.controller";
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {TokenService} from "../../admin/services";


export function createOpenAIRoutes(): express.Router {
    const openAIRouter = express.Router();
    const openAIController: OpenAIController = container.resolve(OpenAIController);
    const tokenService = container.resolve(TokenService);

    openAIRouter.post('/chat/completions', makeJwtAuthMiddleware(tokenService, {useCache: true}), openAIController.chatCompletions);
    openAIRouter.get('/models', makeJwtAuthMiddleware(tokenService, {useCache: true}), openAIController.models);
    return openAIRouter;
}
