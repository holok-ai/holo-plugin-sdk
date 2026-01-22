import 'reflect-metadata';
import {ApiResponse, RequestType} from '@holokai/sdk';
import {RequestService} from '../../admin/services/request.service';
import {HttpApiRequest} from '../types';
import {injectable} from "tsyringe";
import {makeJwtAuthMiddleware} from "../middleware/jwt.middleware";
import {AuthService} from "../../admin/services/auth.service";
import {ProviderService} from "../../services";

@injectable()
export class ProviderHandlers {
    constructor(
        private authService: AuthService,
        private providerService: ProviderService,
        private requestService: RequestService
    ) {

    }

    createMiddleware(providerFamily: string) {
        return makeJwtAuthMiddleware(this.authService, providerFamily, {useCache: true});
    }

    createModelsHandler() {
        return async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
            const {auth} = req;
            if (!auth) {
                res.status(401).json({error: 'Unauthorized'});
                return;
            }

            const provider = await this.providerService.matchProvider(auth.providerName);

            return provider.getModels(auth.app.models.map(model => model.name));
        };
    }

    createRequestHandler(providerFamily: string, requestType: RequestType) {
        return async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
            try {
                await this.requestService.processRequest(providerFamily, requestType, req, res);
            } catch (error) {
                res.status(500).json({error: 'Failed to process request'});
            }
        };
    }
}
