import 'reflect-metadata';
import {injectable} from 'tsyringe';
import type {IPluginRegistry, IProviderPlugin} from '@holokai/types/plugin';
import express, {NextFunction, Router} from 'express';
import {ClassLogger} from '@holokai/sdk';
import {RequestType} from "@holokai/types/holo";
import type {RouteDefinition, RouteTree} from "@holokai/types/routing";
import {RouteHandler} from "@holokai/types/routing";
import {ProviderHandlers} from '../../api/handlers/provider.handlers';
import {HoloApiRequest} from "../../api/types";

@injectable()
export class ProviderPluginRegistry extends ClassLogger implements IPluginRegistry<IProviderPlugin> {
    private readonly latestPlugins: Map<string, IProviderPlugin>;
    private readonly versionedPlugins: Map<string, Map<string, IProviderPlugin>>;

    constructor() {
        super();
        this.latestPlugins = new Map();
        this.versionedPlugins = new Map();
    }

    registerPlugin(plugin: IProviderPlugin, version?: string, isLatest: boolean = true): void {
        if (!plugin.family) {
            throw new Error(`Plugin ${plugin.manifest.name} has no family defined`);
        }
        const family = plugin.family.toUpperCase();
        const pluginVersion = version || plugin.manifest.version;

        if (!this.versionedPlugins.has(family)) {
            this.versionedPlugins.set(family, new Map());
        }
        this.versionedPlugins.get(family)!.set(pluginVersion, plugin);

        if (isLatest) {
            this.latestPlugins.set(family, plugin);
        }
    }

    unregisterPlugin(family: string, version?: string): void {
        const familyKey = family.toUpperCase();

        if (!version) {
            this.latestPlugins.delete(familyKey);
            this.versionedPlugins.delete(familyKey);
        } else {
            const versions = this.versionedPlugins.get(familyKey);
            if (versions) {
                versions.delete(version);

                const latestPlugin = this.latestPlugins.get(familyKey);
                if (latestPlugin?.manifest.version === version) {
                    this.latestPlugins.delete(familyKey);
                }

                if (versions.size === 0) {
                    this.versionedPlugins.delete(familyKey);
                }
            }
        }
    }

    listPlugins(): IProviderPlugin[] {
        const allPlugins: IProviderPlugin[] = [];
        for (const versions of this.versionedPlugins.values()) {
            allPlugins.push(...versions.values());
        }
        return allPlugins;
    }

    getByFamily(family: string, version?: string): IProviderPlugin | null {
        const familyKey = family.toUpperCase();

        if (!version) {
            return this.latestPlugins.get(familyKey) || null;
        }

        const versions = this.versionedPlugins.get(familyKey);
        if (!versions) {
            return null;
        }
        return versions.get(version) || null;
    }

    registerRoutes(
        router: Router,
        providerHandlers: ProviderHandlers
    ): void {
        const logger = this.mlog(this.registerRoutes);
        const plugins = this.listPlugins();

        logger.info(`Registering routes for ${plugins.length} provider plugins`);

        for (const plugin of plugins) {
            const family = plugin.family.toLowerCase();

            logger.info(`Registering routes for ${plugin.family}`);

            const pluginRouter = Router();

            const pluginHandlers = {
                noOpHandler: providerHandlers.createNoOpHandler(plugin.family),
                modelsHandler: providerHandlers.createModelsHandler(),
                requestHandler: (requestType: RequestType) =>
                    providerHandlers.createRequestHandler(plugin.family, requestType),
                passthroughHandler: providerHandlers.createPassthroughHandler(plugin.family)
            };

            const routeTree = plugin.getRoutes();
            const authMiddleware = providerHandlers.createMiddleware(family);

            this.buildRoutesFromTree(pluginRouter, routeTree, pluginHandlers, authMiddleware, family);

            const defaultHandler = plugin.defaultRouteHandler;

            if (defaultHandler === RouteHandler.NOOP) {
                pluginRouter.all('/*', authMiddleware, pluginHandlers.noOpHandler);
                logger.info(`  * (catch-all) /api/${family}/* -> NOOP`);
            } else if (defaultHandler === RouteHandler.PASSTHROUGH) {
                pluginRouter.all('/*', authMiddleware, pluginHandlers.passthroughHandler);
                logger.info(`  * (catch-all) /api/${family}/* -> PASSTHROUGH`);
            }

            router.use(`/${family}`, pluginRouter);
        }

        logger.info('All provider routes registered');
    }

    private buildRoutesFromTree(
        router: Router,
        tree: RouteTree,
        handlers: {
            noOpHandler: any;
            modelsHandler: any;
            requestHandler: (rt: RequestType) => any,
            passthroughHandler: any
        },
        authMiddleware: (req: HoloApiRequest, res: express.Response, next: NextFunction) => Promise<void>,
        providerFamily: string,
        basePath: string = ''
    ): void {
        const logger = this.mlog(this.buildRoutesFromTree);

        for (const [key, value] of Object.entries(tree)) {
            const currentPath = `${basePath}/${key}`;

            if (this.isRouteDefinition(value)) {
                const routeDef = value as RouteDefinition;

                let handler;
                switch (routeDef.handler) {
                    case RouteHandler.MODELS:
                        handler = handlers.modelsHandler;
                        break;
                    case RouteHandler.REQUEST:
                        handler = handlers.requestHandler(routeDef.requestType!);
                        break;
                    case RouteHandler.PASSTHROUGH:
                        handler = handlers.passthroughHandler;
                        break;
                    default:
                        handler = handlers.noOpHandler;
                        break;
                }

                const method = routeDef.method.toLowerCase() as 'get' | 'post';
                router[method](currentPath, authMiddleware, handler);

                logger.info(`  ${routeDef.method} /api/${providerFamily}${currentPath}`);
            } else {
                this.buildRoutesFromTree(router, value as RouteTree, handlers, authMiddleware, providerFamily, currentPath);
            }
        }
    }

    private isRouteDefinition(value: any): value is RouteDefinition {
        return value && typeof value === 'object' && 'method' in value && 'handler' in value;
    }
}
