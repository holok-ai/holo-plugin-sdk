import 'reflect-metadata';
import {injectable} from 'tsyringe';
import type {IPluginRegistry, IProviderPlugin} from '@holokai/sdk/plugin';
import express, {NextFunction, Router} from 'express';
import {RequestType, RouteDefinition, RouteHandler, RouteTree} from '@holokai/sdk';
import {ProviderHandlers} from '../../api/handlers/provider.handlers';
import {ClassLogger} from '../../types/class.logger';
import {HttpApiRequest} from "../../api/types";

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

    private buildRoutesFromTree(
        router: Router,
        tree: RouteTree,
        handlers: { modelsHandler: any; requestHandler: (rt: RequestType) => any },
        authMiddleware: (req: HttpApiRequest, res: express.Response, next: NextFunction) => Promise<void>,
        providerFamily: string,
        basePath: string = ''
    ): void {
        const logger = this.mlog(this.buildRoutesFromTree);

        for (const [key, value] of Object.entries(tree)) {
            const currentPath = `${basePath}/${key}`;

            if (this.isRouteDefinition(value)) {
                const routeDef = value as RouteDefinition;

                const handler = routeDef.handler === RouteHandler.MODELS
                    ? handlers.modelsHandler
                    : handlers.requestHandler(routeDef.requestType!);

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
                modelsHandler: providerHandlers.createModelsHandler(),
                requestHandler: (requestType: RequestType) =>
                    providerHandlers.createRequestHandler(plugin.family, requestType)
            };

            const routeTree = plugin.getRoutes();

            this.buildRoutesFromTree(pluginRouter, routeTree, pluginHandlers, providerHandlers.createMiddleware(family), family);

            router.use(`/${family}`, pluginRouter);
        }

        logger.info('All provider routes registered');
    }
}
