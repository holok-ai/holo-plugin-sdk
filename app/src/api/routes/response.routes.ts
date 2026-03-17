import express from 'express';
import {container} from 'tsyringe';
import {ResponseCrudController} from '../controllers/response.controller';
import {asyncHandler} from '../../utils';

export function createResponseRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ResponseCrudController);

    router.get('/filters', asyncHandler(controller.filters));
    router.get('/:id', asyncHandler(controller.get));
    router.get('/', asyncHandler(controller.list));

    return router;
}
