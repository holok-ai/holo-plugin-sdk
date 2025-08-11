import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import { CustomUrlController } from '../controllers/custom-url.controller';

export function createCustomApplicationRoutes(): express.Router {
    const apiRouter = express.Router();
    const customUrlController: CustomUrlController = container.resolve(CustomUrlController);

    apiRouter.post('/:provider/:appId/*', customUrlController.resolveRequest);
    return apiRouter;
}
