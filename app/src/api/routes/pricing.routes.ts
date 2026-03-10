import express from 'express';
import {container} from 'tsyringe';
import {PricingController} from '../controllers/pricing.controller';

export function createPricingRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(PricingController);

    router.post('/recalculate', controller.recalculate);

    return router;
}
