import express from "express";
import {container} from 'tsyringe';
import {createCustomApplicationRoutes} from "./app.routes";
import {ProviderHandlers} from "../handlers/provider.handlers";
import {ProviderPluginRegistry} from "../../services/plugin/provider-registry.service";

export function createRoutes(): express.Router {
    const router = express.Router();

    const providerHandlers = container.resolve(ProviderHandlers);
    const providerRegistry = container.resolve(ProviderPluginRegistry);

    providerRegistry.registerRoutes(router, providerHandlers);

    router.use('/custom/', createCustomApplicationRoutes());
    return router;
}
