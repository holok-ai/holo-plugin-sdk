import 'reflect-metadata';
import {inject, injectable} from 'tsyringe';
import {BaseController, ApiResponse} from '../../utils/api';
import {HoloApiRequest} from '../types';
import {HoloRequestService} from '../../services/holo.request.service';
import {ResponseService} from '../../services/response.service';
import {GuardService} from '../../services/guard.service';
import {ProviderImplService} from '../../services/plugin';
import {ModelDB, ApplicationDB} from '../../db';
import type {INotificationService} from '@holokai/types/notification';
import {NotificationEventFactory, NotificationServiceToken} from '@holokai/sdk/notification';
import type {HoloRequest, HoloModelInfo, HoloApplicationInfo} from '@holokai/types/holo';

@injectable()
export class HoloChatController extends BaseController {
    constructor(
        private readonly holoRequestService: HoloRequestService,
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService,
        private readonly providerImplService: ProviderImplService,
        private readonly modelDB: ModelDB,
        private readonly applicationDB: ApplicationDB,
        @inject(NotificationServiceToken) private readonly notificationService: INotificationService,
    ) {
        super();
    }

    chat = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const logger = this.mlog(this.chat);
        try {
            const {auth} = req;
            if (!auth) {
                res.status(401).json({success: false, error: {message: 'Unauthorized', code: 'UNAUTHORIZED'}, timestamp: new Date().toISOString()});
                return;
            }

            const holoRequest: HoloRequest = req.body;

            const appSlug = req.headers['x-holo-application'] as string;
            if (appSlug && !holoRequest.application) {
                holoRequest.application = appSlug;
            }

            const target = await this.holoRequestService.resolveTarget(auth, holoRequest);

            const workerRequest = this.holoRequestService.buildWorkerRequest(
                auth,
                target,
                holoRequest,
                {path: req.path, method: req.method, headers: req.headers || {}, query: req.query || {}},
            );

            if (target.application?.guards?.length) {
                const provider = await this.providerImplService.getProviderImplById(target.provider.id);
                await this.notificationService.publish(
                    NotificationEventFactory.fromAuthAndRequest('guard_started', auth, workerRequest, 'Running guards')
                );
                const result = await this.guardService.guard(provider, workerRequest, target.application.guards, auth);
                await this.notificationService.publish(
                    NotificationEventFactory.fromAuthAndRequest(
                        result?.passed ? 'guard_passed' : 'guard_failed',
                        auth, workerRequest, 'Running guards'
                    )
                );
            }

            await this.notificationService.publish(
                NotificationEventFactory.fromAuthAndRequest('request_started', auth, workerRequest, 'Request started')
            );
            await this.responseService.sendRequest(req, res, workerRequest);

            logger.info(`Holo chat request processed`, {requestId: workerRequest.requestId});
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to process chat request', 400);
        }
    };

    cancel = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const {id} = req.params;
            res.json({success: true, data: {id, cancelled: true}, timestamp: new Date().toISOString()});
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to cancel request');
        }
    };

    listModels = async (_req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const models = await this.modelDB.list();
            const data: HoloModelInfo[] = models.map(m => {
                const info: HoloModelInfo = {
                    id: m.access_model || m.name,
                    name: m.name,
                    provider_family: m.metadata?.family || '',
                    capabilities: m.modalities || ['chat'],
                };
                if (m.context_length !== undefined) info.context_length = m.context_length;
                return info;
            });
            res.json({success: true, data, timestamp: new Date().toISOString()});
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to list models');
        }
    };

    listApplications = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const {auth} = req;
            if (!auth) {
                res.status(401).json({success: false, error: {message: 'Unauthorized', code: 'UNAUTHORIZED'}, timestamp: new Date().toISOString()});
                return;
            }

            const apps = await this.applicationDB.getAllByOrg(auth.organizationId);
            const data: HoloApplicationInfo[] = apps.map(app => {
                const info: HoloApplicationInfo = {
                    slug: app.url_slug!,
                    name: app.name,
                    provider_family: app.provider?.type || '',
                    has_system_prompt: !!app.system_prompt,
                    has_guards: !!(app.guards?.length),
                };
                const defaultModel = app.models?.[0]?.access_model || app.models?.[0]?.name;
                if (defaultModel) info.default_model = defaultModel;
                return info;
            });
            res.json({success: true, data, timestamp: new Date().toISOString()});
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to list applications');
        }
    };

    getApplication = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const {auth} = req;
            if (!auth) {
                res.status(401).json({success: false, error: {message: 'Unauthorized', code: 'UNAUTHORIZED'}, timestamp: new Date().toISOString()});
                return;
            }

            const app = await this.applicationDB.getBySlug(auth.organizationId, req.params.slug);
            if (!app) {
                res.status(404).json({success: false, error: {message: 'Application not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()});
                return;
            }

            const data: HoloApplicationInfo = {
                slug: app.url_slug!,
                name: app.name,
                provider_family: app.provider?.type || '',
                has_system_prompt: !!app.system_prompt,
                has_guards: !!(app.guards?.length),
            };
            const defaultModel = app.models?.[0]?.access_model || app.models?.[0]?.name;
            if (defaultModel) data.default_model = defaultModel;
            res.json({success: true, data, timestamp: new Date().toISOString()});
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to get application');
        }
    };
}
