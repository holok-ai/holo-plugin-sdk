import express from 'express';
import {container} from 'tsyringe';
import {ApplicationCrudController} from '../controllers/application.controller';

export function createApplicationRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(ApplicationCrudController);

    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.remove);

    return router;
}
