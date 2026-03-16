import express from 'express';
import {container} from 'tsyringe';
import {PluginLifecycleService} from '../../services/plugin/plugin.lifecycle.service';
import {PluginPackageDB} from '../../db/plugin.package.db';
import {PluginService} from '../../services/plugin/plugin.service';
import type {HoloApiRequest} from '../types';
import type {ApiResponse} from '../../utils';

export function createPluginRoutes(): express.Router {
    const router = express.Router();

    const lifecycle = container.resolve(PluginLifecycleService);
    const packageDB = container.resolve(PluginPackageDB);
    const pluginService = container.resolve(PluginService);

    router.get('/', async (_req: HoloApiRequest, res: ApiResponse) => {
        try {
            const packages = await packageDB.list();
            const plugins = await pluginService.getPlugins();
            res.json({packages, plugins});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    router.get('/:family/status', async (req: HoloApiRequest, res: ApiResponse) => {
        try {
            const family = req.params.family;
            const plugins = await pluginService.getPlugins(p => p.family === family.toUpperCase());
            const pkg = await packageDB.list();
            const familyPkg = pkg.find(p => p.family === family);
            res.json({plugin: plugins[0] ?? null, package: familyPkg ?? null});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    router.post('/install', async (req: HoloApiRequest, res: ApiResponse) => {
        try {
            const {packageName, version} = req.body;
            if (!packageName) {
                res.status(400).json({error: 'packageName is required'});
                return;
            }
            const meta = await lifecycle.install(packageName, version, req.auth?.userId);
            res.json({status: 'installed', ...meta});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    router.post('/:family/enable', async (req: HoloApiRequest, res: ApiResponse) => {
        try {
            const packages = await packageDB.list();
            const pkg = packages.find(p => p.family === req.params.family);
            if (!pkg) {
                res.status(404).json({error: `No installed plugin for family ${req.params.family}`});
                return;
            }
            await lifecycle.enable(pkg.package_name, req.auth?.userId ?? 'admin');
            res.json({status: 'enabled', family: req.params.family});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    router.post('/:family/disable', async (req: HoloApiRequest, res: ApiResponse) => {
        try {
            const packages = await packageDB.list();
            const pkg = packages.find(p => p.family === req.params.family);
            if (!pkg) {
                res.status(404).json({error: `No installed plugin for family ${req.params.family}`});
                return;
            }
            await lifecycle.disable(pkg.package_name);
            res.json({status: 'disabled', family: req.params.family});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    router.post('/uninstall', async (req: HoloApiRequest, res: ApiResponse) => {
        try {
            const {packageName} = req.body;
            if (!packageName) {
                res.status(400).json({error: 'packageName is required'});
                return;
            }
            await lifecycle.uninstall(packageName);
            res.json({status: 'uninstalled', packageName});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    router.post('/:family/reload', async (req: HoloApiRequest, res: ApiResponse) => {
        try {
            const packages = await packageDB.list();
            const pkg = packages.find(p => p.family === req.params.family);
            if (!pkg) {
                res.status(404).json({error: `No installed plugin for family ${req.params.family}`});
                return;
            }
            await lifecycle.reload(pkg.package_name, req.auth?.userId ?? 'admin');
            res.json({status: 'reloaded', family: req.params.family});
        } catch (e) {
            res.status(500).json({error: (e as Error).message});
        }
    });

    return router;
}
