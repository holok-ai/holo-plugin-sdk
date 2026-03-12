import express from 'express';
import {container} from 'tsyringe';
import {ProviderCrudController} from '../controllers/provider.crud.controller';

export function createProviderRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ProviderCrudController);

    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.remove);

    return router;
}
