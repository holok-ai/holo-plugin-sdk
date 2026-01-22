import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {AppController} from '../controllers/app.controller';

export function createCustomApplicationRoutes(): express.Router {
    const apiRouter = express.Router();
    const customUrlController: AppController = container.resolve(AppController);
    apiRouter.post('/:provider/:appSlug/*', customUrlController.resolveRequest);
    return apiRouter;
}
