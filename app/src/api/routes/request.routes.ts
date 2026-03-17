import express from 'express';
import {container} from 'tsyringe';
import {RequestCrudController} from '../controllers/request.controller';
import {asyncHandler} from '../../utils';

export function createRequestRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(RequestCrudController);

    router.get('/:id', asyncHandler(controller.get));
    router.get('/', asyncHandler(controller.list));

    return router;
}
