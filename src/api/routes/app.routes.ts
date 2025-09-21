import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {CustomUrlController} from '../controllers/custom-url.controller';
import {makeAuthMiddleware} from "../middleware/enhanced-auth.middleware";
import {TokenService} from "../../admin/services";

const tokenService = container.resolve(TokenService);

export function createCustomApplicationRoutes(): express.Router {
    const apiRouter = express.Router();
    const customUrlController: CustomUrlController = container.resolve(CustomUrlController);

    apiRouter.post('/:provider/:appId/*', makeAuthMiddleware(tokenService, {useCache: true}), customUrlController.resolveRequest);
    return apiRouter;
}
