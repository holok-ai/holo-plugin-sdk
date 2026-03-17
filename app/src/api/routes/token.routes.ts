import express from 'express';
import {container} from 'tsyringe';
import {TokenController} from '../controllers/token.controller';
import {asyncHandler} from '../../utils';

export function createTokenRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(TokenController);

    router.post('/', asyncHandler(controller.create));
    router.get('/', asyncHandler(controller.list));
    router.get('/:id', asyncHandler(controller.get));
    router.delete('/:id', asyncHandler(controller.deactivate));

    return router;
}
