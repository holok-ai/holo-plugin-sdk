import express from 'express';
import {container} from 'tsyringe';
import {TokenController} from '../controllers/token.controller';

export function createTokenRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(TokenController);

    router.post('/', controller.create);
    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.delete('/:id', controller.deactivate);

    return router;
}
