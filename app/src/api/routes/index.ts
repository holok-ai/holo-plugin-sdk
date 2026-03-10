import express from "express";
import {container} from 'tsyringe';
import {createCustomApplicationRoutes} from "./app.routes";
import {AuthService} from "../../services";
import {createNotificationRoutes} from "./notification.routes";
import {createTokenRoutes} from "./token.routes";
import {createPricingRoutes} from "./pricing.routes";
import {makeAuthMiddleware} from "../middleware";
import {PluginRouteService} from "../../services/plugin/plugin.route.service";

export async function createRoutes(): Promise<express.Router> {
    const router = express.Router();

    const pluginRouteService = container.resolve(PluginRouteService);

    await pluginRouteService.registerRoutes(router);

    const authService = container.resolve(AuthService);

    router.use('/custom/', createCustomApplicationRoutes());
    router.use('/notifications', makeAuthMiddleware(authService), createNotificationRoutes());
    router.use('/tokens', makeAuthMiddleware(authService), createTokenRoutes());
    router.use('/pricing', makeAuthMiddleware(authService), createPricingRoutes());
    return router;
}
