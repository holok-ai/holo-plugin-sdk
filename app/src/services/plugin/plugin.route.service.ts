import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClassLogger} from "@holokai/sdk";
import {RequestService} from "../request.service";
import {IProviderPlugin, PluginType, RouteHandler} from "@holokai/types";
import {Router} from "express";
import {PluginService} from "./plugin.service";
import {Plugin, Protocol} from "@holokai/types/entities";
import {HoloApiRequest} from "../../api/types";
import {ApiResponse} from "../../utils";
import {makeAuthMiddleware} from "../../api/middleware";
import {ProviderImplService} from "./provider.impl.service";
import {ProviderPluginService} from "./provider.plugin.service";
import {AuthService} from "../auth";

@injectable()
export class PluginRouteService extends ClassLogger {
    constructor(
        private authService: AuthService,
        private pluginService: PluginService,
        private providerImplService: ProviderImplService,
        private providerPluginService: ProviderPluginService,
        private requestService: RequestService
    ) {
        super();
    }

    async registerRoutes(router: Router): Promise<void> {
        const logger = this.mlog(this.registerRoutes);
        logger.info('Registering plugin routes...');
        for (const plugin of await this.pluginService.getPlugins()) {
            switch (plugin.type) {
                case PluginType.PROVIDER:
                    const impl = await this.pluginService.getImplById(plugin.id) as IProviderPlugin;
                    await this.registerRoute(plugin, impl, router);
                    break;
            }
        }
    }

    async registerRoute(plugin: Plugin, pluginImpl: IProviderPlugin, router: Router) {
        const logger = this.mlog(this.registerRoute);
        const family = plugin.family.toLowerCase();

        logger.info(`Registering routes for plugin: ${pluginImpl.name}`);

        const pluginRouter = Router();
        const authMiddleware = this.createMiddleware(family);

        for (const route of pluginImpl.getRoutes()) {

            let handler;
            switch (route.handler) {
                case RouteHandler.MODELS:
                    handler = this.createModelsHandler();
                    break;
                case RouteHandler.REQUEST:
                    const protocol = await this.providerPluginService.getProtocol(plugin.id, route.protocol.name);
                    handler = this.createRequestHandler(plugin, protocol);
                    break;
                default:
                    handler = this.createNoOpHandler(family);
                    break;
            }

            const method = route.method.toLowerCase() as 'get' | 'post';
            for (const path of route.paths) {
                pluginRouter[method](`${path}`, authMiddleware, handler);
            }
        }

        if (plugin.is_default) {
            router.use(`/${family}`, pluginRouter);
        }
        // router.use(`/plugins/${family.toLowerCase()}/${plugin.version}`, pluginRouter);
    }

    createMiddleware(providerFamily: string) {
        return makeAuthMiddleware(this.authService, {useCache: true, providerFamily});
    }

    createModelsHandler() {
        return async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
            const {auth} = req;
            if (!auth) {
                res.status(401).json({error: 'Unauthorized'});
                return;
            }

            try {
                const {application, applications} = auth;
                const apps = application ? [application] : applications;
                const providerModelIds = new Map<string, Set<string>>();

                for (const a of apps) {
                    const provider = a.provider!;
                    let ids = providerModelIds.get(provider.id);
                    if (!ids) providerModelIds.set(provider.id, ids = new Set());

                    for (const m of (a.models ?? [])) {
                        ids.add(m.name);
                    }
                }

                const providerModels = new Map<string, any[]>(); // replace any with your model type

                await Promise.all(
                    Array.from(providerModelIds.entries()).map(async ([providerId, modelNames]) => {
                        const provider = await this.providerImplService.getProviderImplById(providerId);

                        const models = await provider.getModels(Array.from(modelNames));
                        providerModels.set(providerId, models);
                    })
                );

                const models = Array.from(providerModels.values()).flat();
                res.status(200).json(models);
            } catch (error) {
                res.status(500).json({error: (error as Error).message});
            }
        };
    }

    createRequestHandler(plugin: Plugin, protocol: Protocol) {
        return async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
            try {
                await this.requestService.processRequest(plugin, protocol, req, res);
            } catch (e: any) {
                this.log.error(`Error handling ${plugin.name}:${plugin.version} ${protocol.name} request: ${e?.message ?? e}`);
                res.status(500).json({error: 'Failed to process request'});
            }
        };
    }

    createNoOpHandler(providerFamily: string) {
        return async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
            const logger = this.mlog(`${providerFamily}NoOpHandler`);
            logger.debug(`Received data: ${JSON.stringify(req.body)}`);
            res.status(204);
        }
    }
}