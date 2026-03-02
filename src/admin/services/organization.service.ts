import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {OrganizationConfigCacheService} from "./organization.config.cache.service";
import {
    ApplicationConfigProps,
    ClassLogger,
    ModelConfigProps,
    PromptConfigProps,
    ProviderConfigProps
} from "@holokai/sdk";
import {OrganizationConfigCache} from "../types";

@injectable()
export class OrganizationService extends ClassLogger {
    constructor(
        private orgCacheService: OrganizationConfigCacheService,
    ) {
        super();
    }

    withOrganization(orgId: string): OrganizationConfigCache | undefined {
        return this.orgCacheService.get(orgId);
    }

    getApplication(orgId: string, appId: string): ApplicationConfigProps | undefined {
        return this.orgCacheService.getApplication(orgId, appId);
    }

    getProviderByModel(orgId: string, slug: string, modelName: string): ProviderConfigProps {
        const logger = this.mlog(this.getProviderByModel);
        const models = this.getModels(orgId, slug);
        if (!models) {
            let msg = `[${orgId}](${slug}) No models found application.`;
            logger.error(msg);
            throw new Error(msg);
        }

        const model = models.find(m => m.name === modelName || m.accessModel === modelName);

        if (!model) {
            let msg = `[${orgId}](${slug}) Model not found: ${modelName}`;
            logger.error(msg);
            logger.error(`Available models: ${JSON.stringify(models)}`);
            throw new Error(msg);
        }

        const provider = this.getProvider(orgId, model.providerName);

        if (!provider) {
            let msg = `[${orgId}](${slug}) No provider found with model.`;
            logger.error(msg);
            throw new Error(msg);
        }

        return provider;
    }


    getProvider(orgId: string, providerName: string): ProviderConfigProps | undefined {
        return this.orgCacheService.getProvider(orgId, providerName);
    }

    getModels(orgId: string, urlSlug: string): ModelConfigProps[] | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)?.models;
    }

    getAllModels(orgId: string, urlSlugs: string[]): ModelConfigProps[] {
        const models = new Set<ModelConfigProps>();

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

    getGuards(orgId: string, urlSlug: string): PromptConfigProps[] | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)!.guards;
    }

    getSystemPrompt(orgId: string, urlSlug: string): PromptConfigProps | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)!.systemPrompt;
    }

    getEvaluators(orgId: string, urlSlug: string): PromptConfigProps[] | undefined {
        return this.orgCacheService.getApplication(orgId, urlSlug)!.evaluators;
    }
}
