import express from 'express';
import {container} from 'tsyringe';
import {AnalyticsController} from '../controllers/analytics.controller';
import {asyncHandler} from '../../utils';

export function createAnalyticsRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(AnalyticsController);

    router.get('/cost-summary', asyncHandler(controller.costSummary));
    router.get('/token-usage', asyncHandler(controller.tokenUsage));
    router.get('/request-counts', asyncHandler(controller.requestCounts));

    return router;
}
