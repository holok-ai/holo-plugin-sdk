import express from 'express';
import {container} from 'tsyringe';
import {ModelCrudController} from '../controllers/model.controller';
import {asyncHandler} from '../../utils';

export function createModelRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ModelCrudController);

    router.get('/', asyncHandler(controller.list));
    router.get('/:id', asyncHandler(controller.get));
    router.post('/', asyncHandler(controller.create));
    router.put('/:id', asyncHandler(controller.update));
    router.delete('/:id', asyncHandler(controller.remove));

    return router;
}
