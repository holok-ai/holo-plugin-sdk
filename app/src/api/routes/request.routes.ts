import express from 'express';
import {container} from 'tsyringe';
import {RequestCrudController} from '../controllers/request.controller';

export function createRequestRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(RequestCrudController);

    router.get('/:id', controller.get);
    router.get('/', controller.list);

    return router;
}
