import express from 'express';
import {container} from 'tsyringe';
import {CacheController} from '../controllers/cache.controller';

export function createCacheRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(CacheController);

    router.post('/invalidate/provider', controller.invalidateProvider);
    router.post('/invalidate/application', controller.invalidateApplication);
    router.post('/invalidate/access', controller.invalidateAccess);
    router.post('/invalidate/auth', controller.invalidateAuth);
    router.post('/invalidate/org', controller.invalidateOrg);
    router.post('/invalidate/user', controller.invalidateUser);

    return router;
}
