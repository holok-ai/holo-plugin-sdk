import express from 'express';
import {container} from 'tsyringe';
import {HoloChatController} from '../controllers/holo.chat.controller';

export function createHoloChatRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloChatController);

    router.post('/', controller.chat);
    router.post('/:id/cancel', controller.cancel);

    return router;
}

export function createHoloModelRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloChatController);

    router.get('/', controller.listModels);

    return router;
}

export function createHoloApplicationRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloChatController);

    router.get('/', controller.listApplications);
    router.get('/:slug', controller.getApplication);

    return router;
}
