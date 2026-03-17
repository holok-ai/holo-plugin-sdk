import express from 'express';
import {container} from 'tsyringe';
import {HoloThreadController} from '../controllers/holo.thread.controller';
import {asyncHandler} from '../../utils';

export function createHoloThreadRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloThreadController);

    router.get('/', asyncHandler(controller.list));
    router.get('/:id', asyncHandler(controller.get));
    router.post('/', asyncHandler(controller.create));
    router.patch('/:id', asyncHandler(controller.update));
    router.delete('/:id', asyncHandler(controller.remove));
    router.get('/:id/messages', asyncHandler(controller.messages));

    return router;
}
