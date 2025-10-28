import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {AppController} from '../controllers/app.controller';
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {TokenService} from "../../admin/services";

export function createCustomApplicationRoutes(): express.Router {
    const apiRouter = express.Router();
    const customUrlController: AppController = container.resolve(AppController);
    const tokenService = container.resolve(TokenService);

    apiRouter.post('/:provider/:appSlug/*', makeJwtAuthMiddleware(tokenService, {useCache: true}), customUrlController.resolveRequest);
    return apiRouter;
}
