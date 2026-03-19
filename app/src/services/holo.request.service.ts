import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {v4 as uuidv4, validate as isUUID} from 'uuid';
import {ClassLogger, HoloError, pickDefined} from '@holokai/sdk';
import {ApplicationDB, ModelDB, ProtocolDB, ProviderDB} from '../db';
import {ProviderPluginService} from './plugin';
import type {HoloWorkerRequest} from '@holokai/types/worker';
import type {HoloRequest} from '@holokai/types/holo';
import type {Auth} from '@holokai/types/api';
import type {Application, Protocol, Provider} from '@holokai/types/entities';
import {ProtocolCapability} from '@holokai/types/entities';
import {env} from '../env';

export interface HoloResolvedTarget {
    provider: Provider;
    protocol: Protocol;
    application?: Application;
    model: string;
}

@injectable()
export class HoloRequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly modelDB: ModelDB,
        private readonly providerDB: ProviderDB,
        private readonly applicationDB: ApplicationDB,
        private readonly protocolDB: ProtocolDB,
        private readonly providerPluginService: ProviderPluginService,
    ) {
        super();
    }

    async resolveTarget(auth: Auth, request: HoloRequest): Promise<HoloResolvedTarget> {
        if (request.application) {
            return this.resolveFromApplication(auth, request);
        }

        if (request.model) {
            return this.resolveFromModel(auth, request);
        }

        throw HoloError.badRequest('Either model or application must be specified');
    }

    private async resolveFromApplication(auth: Auth, request: HoloRequest): Promise<HoloResolvedTarget> {
        const logger = this.mlog(this.resolveFromApplication);
        const slug = request.application!;

        const application = await this.applicationDB.getBySlug(auth.organizationId, slug);
        if (!application) {
            throw HoloError.notFound(`Application '${slug}'`);
        }

        const provider = application.provider!;
        const protocol = await this.findChatProtocol(provider.plugin_id);

        const model = request.model || this.getDefaultModel(application);

        logger.info(`Resolved application ${slug} → provider ${provider.name}, model ${model}`);
        return {provider, protocol, application, model};
    }

    private async resolveFromModel(auth: Auth, request: HoloRequest): Promise<HoloResolvedTarget> {
        const logger = this.mlog(this.resolveFromModel);
        const modelRef = request.model;

        if (isUUID(modelRef)) {
            const model = await this.modelDB.getById(modelRef);
            if (!model) {
                throw HoloError.notFound(`Model '${modelRef}'`);
            }
            const provider = await this.providerDB.getById(model.provider_id);
            if (!provider) {
                throw HoloError.notFound(`Provider for model '${modelRef}'`);
            }
            const protocol = await this.findChatProtocol(provider.plugin_id);
            logger.info(`Resolved model UUID ${modelRef} → provider ${provider.name}`);
            return {provider, protocol, model: model.access_model || model.name};
        }

        if (request.provider) {
            const provider = await this.resolveProvider(request.provider);
            const models = await this.modelDB.listByProvider(provider.id);
            const model = models.find(m => m.access_model === modelRef || m.name === modelRef);
            if (!model) {
                throw HoloError.notFound(`Model '${modelRef}' for provider '${provider.name}'`);
            }
            const protocol = await this.findChatProtocol(provider.plugin_id);
            logger.info(`Resolved model ${modelRef} → provider ${provider.name} (provider-scoped)`);
            return {provider, protocol, model: modelRef};
        }

        const models = await this.modelDB.list();
        const model = models.find(m => m.access_model === modelRef || m.name === modelRef);
        if (!model) {
            throw HoloError.notFound(`Model '${modelRef}'`);
        }

        const provider = await this.providerDB.getById(model.provider_id);
        if (!provider) {
            throw HoloError.notFound(`Provider for model '${modelRef}'`);
        }

        if (auth.userId) {
            const apps = auth.applications || [];
            const hasAccess = apps.some(app =>
                app.provider_id === provider.id
            );
            if (!hasAccess) {
                throw HoloError.forbidden(`No access to model: ${modelRef}`);
            }
        }

        const protocol = await this.findChatProtocol(provider.plugin_id);

        logger.info(`Resolved model ${modelRef} → provider ${provider.name}`);
        return {provider, protocol, model: modelRef};
    }

    private async resolveProvider(ref: string): Promise<Provider> {
        if (isUUID(ref)) {
            const provider = await this.providerDB.getById(ref);
            if (!provider) throw HoloError.notFound(`Provider '${ref}'`);
            return provider;
        }
        const provider = await this.providerDB.get(ref);
        if (!provider) throw HoloError.notFound(`Provider '${ref}'`);
        return provider;
    }

    private async findChatProtocol(pluginId: string): Promise<Protocol> {
        const cached = this.providerPluginService.getProtocolByCapability(pluginId, ProtocolCapability.CHAT);
        if (cached) return cached;

        const protocols = await this.protocolDB.getByPlugin(pluginId);
        const chatProtocol = protocols.find(p => p.capability === ProtocolCapability.CHAT);
        if (!chatProtocol) {
            throw new Error(`No chat protocol found for plugin: ${pluginId}`);
        }
        return chatProtocol;
    }

    private getDefaultModel(application: Application): string {
        const models = application.models || [];
        if (models.length > 0) {
            return models[0].access_model || models[0].name;
        }
        throw HoloError.badRequest(`Application '${application.name}' has no models configured`);
    }

    buildWorkerRequest(
        auth: Auth,
        target: HoloResolvedTarget,
        request: HoloRequest,
        rawRequest: { path: string; method: string; headers: Record<string, any>; query: Record<string, any> },
    ): HoloWorkerRequest {
        const {provider, protocol, application} = target;

        return pickDefined({
            organizationId: auth.organizationId,
            application,
            provider,
            protocol,
            sourceId: this.serverId,
            appSlug: application?.url_slug,
            userId: auth.userId,
            clientIdentifier: auth.clientIdentifier,
            tokenType: auth.tokenType,
            requestId: uuidv4(),
            payload: request,
            timestamp: new Date().toISOString(),
            isStreaming: request.stream === true,
            threadId: request.thread_id,
            branchId: request.branch,
            httpRequestDetails: rawRequest,
            isHoloNative: true,
            guards: application?.guards,
            systemPrompt: application?.system_prompt,
        }) as HoloWorkerRequest;
    }
}
