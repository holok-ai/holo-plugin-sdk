import 'reflect-metadata';
import {injectable} from "tsyringe";
import {HttpApiRequest} from "../types";
import {ApiResponse, BaseController} from "@holokai/sdk";

@injectable()
export class AppController extends BaseController {

    constructor() {
        super();
    }

    public resolveRequest = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        const logger = this.mlog(this.resolveRequest);
        try {
            const {provider, appSlug} = req.params;
            const remainingPath = req.params[0];

            // Rewrite the URL to match the provider route
            req.appSlug = appSlug;
            req.url = `/api/${provider.toLowerCase()}/${remainingPath}`;


            // Forward to Express routing
            (req.app as any).handle(req, res, (err: any) => {
                if (err) {
                    logger.error('Failed to forward request', err);
                    if (!res.headersSent) {
                        res.status(500).json({error: 'Failed to forward request'});
                    }
                }
            });

        } catch (error) {
            this.handleError(res, error as Error, 'Failed to resolve request');
        }
    }
}
