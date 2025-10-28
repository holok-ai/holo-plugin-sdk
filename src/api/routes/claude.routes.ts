import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {ClaudeController} from "../controllers/claude.controller";
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {TokenService} from "../../admin/services";


export function createClaudeRoutes(): express.Router {
    const openAIRouter = express.Router();
    const claudeController: ClaudeController = container.resolve(ClaudeController);
    const tokenService = container.resolve(TokenService);

    openAIRouter.post('/messages', makeJwtAuthMiddleware(tokenService, {useCache: true}), claudeController.messages);
    openAIRouter.get('/models', makeJwtAuthMiddleware(tokenService, {useCache: true}), claudeController.models);
    return openAIRouter;
}
