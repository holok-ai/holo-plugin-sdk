import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import OllamaController from "../controllers/ollama.controller";
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {TokenService} from "../../admin/services";

export function createApiRoutes(): express.Router {
    const apiRouter = express.Router();
    const ollamaController: OllamaController = container.resolve(OllamaController);
    const tokenService = container.resolve(TokenService);

    apiRouter.post('/generate', makeJwtAuthMiddleware(tokenService, {useCache: true}), ollamaController.generate);
    apiRouter.post('/chat', makeJwtAuthMiddleware(tokenService, {useCache: true}), ollamaController.chat);
    apiRouter.get('/tags', makeJwtAuthMiddleware(tokenService, {useCache: true}), ollamaController.models);
    return apiRouter;
}
