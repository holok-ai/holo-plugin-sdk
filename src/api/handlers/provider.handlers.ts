import 'reflect-metadata';
import {ApiResponse, ClassLogger, RequestType} from '@holokai/sdk';
import {RequestService} from '../../admin/services/request.service';
import {HoloApiRequest} from '../types';
import {injectable} from "tsyringe";
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {AuthService} from "../../admin/services/auth.service";
import {ProviderService} from "../../services";

@injectable()
export class ProviderHandlers extends ClassLogger {
    constructor(
        private authService: AuthService,
        private providerService: ProviderService,
        private requestService: RequestService
    ) {
        super();
    }

    createMiddleware(providerFamily: string) {
        return makeJwtAuthMiddleware(this.authService, {useCache: true}, providerFamily);
    }

    createModelsHandler() {
        return async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
            const {auth} = req;
            if (!auth) {
                res.status(401).json({error: 'Unauthorized'});
                return;
            }

            try {
                const {app, availableApps} = auth;
                const apps = app ? [app] : availableApps;
                const providerModelNames = new Map<string, Set<string>>();

                for (const a of apps) {
                    let names = providerModelNames.get(a.providerName);
                    if (!names) providerModelNames.set(a.providerName, names = new Set());

                    for (const m of a.models) {
                        names.add(m.name);
                    }
                }

                const providerModels = new Map<string, any[]>(); // replace any with your model type

                await Promise.all(
                    Array.from(providerModelNames.entries()).map(async ([providerName, modelNames]) => {
                        const provider = await this.providerService.matchProvider(providerName);

                        const models = await provider.getModels(Array.from(modelNames));
                        providerModels.set(providerName, models);
                    })
                );

                const models = Array.from(providerModels.values()).flat();
                res.status(200).json(models);
            } catch (error) {
                res.status(500).json({error: (error as Error).message});
            }
        };
    }

    createRequestHandler(providerFamily: string, requestType: RequestType) {
        return async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
            try {
                await this.requestService.processRequest(providerFamily, requestType, req, res);
            } catch (error) {
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

    createPassthroughHandler(providerFamily: string) {
        return async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
            try {
                await this.requestService.processRequest(providerFamily, RequestType.CHAT, req, res, true);
            } catch (error) {
                res.status(500).json({error: 'Failed to process passthrough request'});
            }
        };
    }
}
