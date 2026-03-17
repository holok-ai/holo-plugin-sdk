import express from 'express';
import {container} from 'tsyringe';
import {CacheController} from '../controllers/cache.controller';
import {asyncHandler} from '../../utils';

export function createCacheRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(CacheController);

    router.post('/invalidate/provider', asyncHandler(controller.invalidateProvider));
    router.post('/invalidate/application', asyncHandler(controller.invalidateApplication));
    router.post('/invalidate/access', asyncHandler(controller.invalidateAccess));
    router.post('/invalidate/auth', asyncHandler(controller.invalidateAuth));
    router.post('/invalidate/org', asyncHandler(controller.invalidateOrg));
    router.post('/invalidate/user', asyncHandler(controller.invalidateUser));

    return router;
}
