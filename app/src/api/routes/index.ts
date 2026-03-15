import express from "express";
import {container} from 'tsyringe';
import {createCustomApplicationRoutes} from "./app.routes";
import {AuthService} from "../../services";
import {createNotificationRoutes} from "./notification.routes";
import {createTokenRoutes} from "./token.routes";
import {createPricingRoutes} from "./pricing.routes";
import {createCacheRoutes} from "./cache.routes";
import {createProviderRoutes} from "./provider.routes";
import {createApplicationRoutes} from "./application.routes";
import {createModelRoutes} from "./model.routes";
import {createResponseRoutes} from "./response.routes";
import {createRequestRoutes} from "./request.routes";
import {createAnalyticsRoutes} from "./analytics.routes";
import {createHoloChatRoutes, createHoloModelRoutes, createHoloApplicationRoutes} from "./holo.chat.routes";
import {makeAuthMiddleware} from "../middleware";
import {PluginRouteService} from "../../services/plugin/plugin.route.service";

export async function createProviderProxyRoutes(): Promise<express.Router> {
    const router = express.Router();

    const pluginRouteService = container.resolve(PluginRouteService);
    await pluginRouteService.registerRoutes(router);

    router.use('/custom/', createCustomApplicationRoutes());
    return router;
}

export function createHoloRoutes(): express.Router {
    const router = express.Router();

    const authService = container.resolve(AuthService);
    const auth = makeAuthMiddleware(authService);

    // Holo native SDK endpoints
    router.use('/chat', auth, createHoloChatRoutes());
    router.use('/models', auth, createHoloModelRoutes());
    router.use('/applications', auth, createHoloApplicationRoutes());

    return router;
}

export function createAdminRoutes(): express.Router {
    const router = express.Router();

    const authService = container.resolve(AuthService);
    const auth = makeAuthMiddleware(authService);

    router.use('/notifications', auth, createNotificationRoutes());
    router.use('/tokens', auth, createTokenRoutes());
    router.use('/pricing', auth, createPricingRoutes());
    router.use('/cache', auth, createCacheRoutes());
    router.use('/providers', auth, createProviderRoutes());
    router.use('/applications', auth, createApplicationRoutes());
    router.use('/models', auth, createModelRoutes());
    router.use('/responses', auth, createResponseRoutes());
    router.use('/requests', auth, createRequestRoutes());
    router.use('/analytics', auth, createAnalyticsRoutes());
    return router;
}
