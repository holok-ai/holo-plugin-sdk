import express from 'express';
import {container} from 'tsyringe';
import {HoloChatController} from '../controllers/holo.chat.controller';
import {asyncHandler} from '../../utils';

export function createHoloChatRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloChatController);

    router.post('/', asyncHandler(controller.chat));
    router.post('/:id/cancel', asyncHandler(controller.cancel));

    return router;
}

export function createHoloModelRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloChatController);

    router.get('/', asyncHandler(controller.listModels));

    return router;
}

export function createHoloApplicationRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(HoloChatController);

    router.get('/', asyncHandler(controller.listApplications));
    router.get('/:slug', asyncHandler(controller.getApplication));

    return router;
}
