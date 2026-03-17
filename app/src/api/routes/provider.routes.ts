import express from 'express';
import {container} from 'tsyringe';
import {ProviderCrudController} from '../controllers/provider.crud.controller';
import {asyncHandler} from '../../utils';

export function createProviderRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ProviderCrudController);

    router.get('/', asyncHandler(controller.list));
    router.get('/:id', asyncHandler(controller.get));
    router.post('/', asyncHandler(controller.create));
    router.put('/:id', asyncHandler(controller.update));
    router.delete('/:id', asyncHandler(controller.remove));

    return router;
}
