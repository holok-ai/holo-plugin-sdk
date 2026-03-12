import express from 'express';
import {container} from 'tsyringe';
import {ResponseCrudController} from '../controllers/response.controller';

export function createResponseRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ResponseCrudController);

    router.get('/filters', controller.filters);
    router.get('/:id', controller.get);
    router.get('/', controller.list);

    return router;
}
