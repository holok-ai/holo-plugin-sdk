import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import OllamaController from "../controllers/ollama.controller";

export function createApiRoutes(): express.Router {
    const apiRouter = express.Router();
    const ollamaController: OllamaController = container.resolve(OllamaController);

    apiRouter.post('/generate', ollamaController.generate);
    apiRouter.post('/chat', ollamaController.chat);
    return apiRouter;
}
