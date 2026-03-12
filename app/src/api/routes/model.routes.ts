import express from 'express';
import {container} from 'tsyringe';
import {ModelCrudController} from '../controllers/model.controller';

export function createModelRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ModelCrudController);

    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.remove);

    return router;
}
