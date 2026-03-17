import express from 'express';
import {container} from 'tsyringe';
import {PricingController} from '../controllers/pricing.controller';
import {asyncHandler} from '../../utils';

export function createPricingRoutes(): express.Router {
    const router = express.Router();
    const controller = container.resolve(PricingController);

    router.post('/recalculate', asyncHandler(controller.recalculate));

    return router;
}
