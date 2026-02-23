import express from "express";
import {container} from 'tsyringe';
import {createCustomApplicationRoutes} from "./app.routes";
import {ProviderHandlers} from "../handlers/provider.handlers";
import {ProviderPluginRegistry} from "../../services/plugin/provider-registry.service";
import {createNotificationRoutes} from "./notification.routes";
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {AuthService} from "../../admin/services/auth.service";

export function createRoutes(): express.Router {
    const router = express.Router();

    const providerHandlers = container.resolve(ProviderHandlers);
    const providerRegistry = container.resolve(ProviderPluginRegistry);

    providerRegistry.registerRoutes(router, providerHandlers);

    const authService = container.resolve(AuthService);

    router.use('/custom/', createCustomApplicationRoutes());
    router.use('/notifications', makeJwtAuthMiddleware(authService, {useCache: true}), createNotificationRoutes());
    return router;
}
