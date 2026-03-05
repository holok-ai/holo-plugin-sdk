import express from "express";
import {container} from 'tsyringe';
import {createCustomApplicationRoutes} from "./app.routes";
import {ProviderController} from "../controllers/provider.controller";
import {ProviderPluginRegistry} from "../../services/plugin/provider.registry.service";
import {createNotificationRoutes} from "./notification.routes";
import {createTokenRoutes} from "./token.routes";
import {makeAuthMiddleware} from "../middleware/auth.middleware";
import {AuthService} from "../../services/auth/auth.service";

export function createRoutes(): express.Router {
    const router = express.Router();

    const providerHandlers = container.resolve(ProviderController);
    const providerRegistry = container.resolve(ProviderPluginRegistry);

    providerRegistry.registerRoutes(router, providerHandlers);

    const authService = container.resolve(AuthService);

    router.use('/custom/', createCustomApplicationRoutes());
    router.use('/notifications', makeAuthMiddleware(authService), createNotificationRoutes());
    router.use('/tokens', makeAuthMiddleware(authService), createTokenRoutes());
    return router;
}
