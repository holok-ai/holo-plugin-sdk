import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import { CustomUrlController } from '../controllers/custom-url.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

export function createCustomApplicationRoutes(): express.Router {
    const apiRouter = express.Router();
    const customUrlController: CustomUrlController = container.resolve(CustomUrlController);

    apiRouter.post('/:provider/:appId/*', authenticateJWT, customUrlController.resolveRequest);
    return apiRouter;
}
