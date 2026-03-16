import express from 'express';
import {container} from 'tsyringe';
import {HoloThreadController} from '../controllers/holo.thread.controller';

export function createHoloThreadRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloThreadController);

    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.patch('/:id', controller.update);
    router.delete('/:id', controller.remove);
    router.get('/:id/messages', controller.messages);

    return router;
}
