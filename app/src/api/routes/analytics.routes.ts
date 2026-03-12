import express from 'express';
import {container} from 'tsyringe';
import {AnalyticsController} from '../controllers/analytics.controller';

export function createAnalyticsRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(AnalyticsController);

    router.get('/cost-summary', controller.costSummary);
    router.get('/token-usage', controller.tokenUsage);
    router.get('/request-counts', controller.requestCounts);

    return router;
}
