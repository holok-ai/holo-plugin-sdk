import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {OrganizationCacheService} from "./organization.cache.service";
import {Application, Model, OrganizationCache, Prompt, Provider} from "../../cache";
import {ProviderType} from "../../providers/types";
import {ClassLogger} from "../../types/class.logger";

@injectable()
export class OrganizationService extends ClassLogger {
    constructor(
        private orgCacheService: OrganizationCacheService,
    ) {
        super();
    }

    withOrganization(orgId: string): OrganizationCache | undefined {
        return this.orgCacheService.get(orgId);
    }

    getApplication(orgId: string, appId: string): Application | undefined {
        return this.orgCacheService.getApplication(orgId, appId);
    }

    /** @deprecated **/
    getFirstProviderByType(providerType: ProviderType): Provider | undefined {
        return this.orgCacheService.getFirstProviderOfType(providerType);
    }

    getProviderByModel(orgId: string, slug: string, modelName: string): Provider | undefined {
        const logger = this.mlog(this.getProviderByModel);
        const models = this.getModels(orgId, slug);
        logger.info(`Models: ${JSON.stringify(models, null, 2)}`);
        logger.info(`Model name: ${modelName}`);
        if (!models) return;

        const model = models.find(m => m.name === modelName || m.accessModel === modelName);
        logger.info(`Model: ${JSON.stringify(model, null, 2)}`);
        if (!model) return;

        return this.getProvider(orgId, model.providerName);
    }


    getProvider(orgId: string, providerName: string): Provider | undefined {
        return this.orgCacheService.getProvider(orgId, providerName);
    }

    getModels(orgId: string, urlSlug: string): Model[] | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)?.models;
    }

    getAllModels(orgId: string, urlSlugs: string[]): Model[] {
        const models = new Set<Model>();

        for (const slug of urlSlugs) {
            const app = this.orgCacheService.getApplication(orgId, slug);
            if (app?.models) {
                for (const model of app.models) {
                    models.add(model);
                }
            }
        }
        return Array.from(models);
    }

    getGuards(orgId: string, urlSlug: string): Prompt[] | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)?.guards;
    }

    getSystemPrompt(orgId: string, urlSlug: string): Prompt | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)?.systemPrompt;
    }

    getEvaluators(orgId: string, urlSlug: string): Prompt[] | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)?.evaluators;
    }
}
