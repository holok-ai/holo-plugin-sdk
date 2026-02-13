import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {Application, Organization, OrganizationCache, Provider} from "../../cache";
import {ApplicationConfigValidator, OrganizationConfigValidator} from "../validators";
import {ApplicationConfig, HoloConfigAction, OrganizationConfig} from "../types";
import logger from "../../utils/logger";

@injectable()
export class OrganizationCacheService {

    private orgCaches = new Map<string, OrganizationCache>();

    constructor() {
    }

    applyConfig(c: OrganizationConfig) {
        const config = OrganizationConfigValidator.assert(c);

        switch (config.action) {
            case HoloConfigAction.DELETE:
                break;
            default:
                this.setOrganizations(config.data);
                break;
        }
    }

    applyApplicationConfig(c: ApplicationConfig) {
        const config = ApplicationConfigValidator.assert(c);
        this.setApplications(config.data)
    }

    get(id: string): OrganizationCache | undefined {
        return this.orgCaches.get(id);
    }

    set(organization: Organization) {
        this.orgCaches.set(organization.id, new OrganizationCache(organization));
    }

    del(id: string) {
        this.orgCaches.delete(id);
    }

    mdel(ids: string[]) {
        for (let i = 0; i < ids.length; i++) {
            this.del(ids[i]);
        }
    }

    setOrganizations(organizations: readonly Organization[]) {
        // as organizations and configurations scale, this is most performant
        for (let i = 0; i < organizations.length; i++) {
            this.set(organizations[i]);
        }
    }

    setApplications(applications: readonly Application[]) {
        for (let i = 0; i < applications.length; i++) {
            const app = applications[i];
            const {organizationId, urlSlug} = app;
            let orgCache = this.get(organizationId);

            if (!orgCache) {
                logger.warn(`Organization ${organizationId} not found in cache, creating minimal org cache for application ${urlSlug}`, {
                    organizationId,
                    urlSlug,
                    existingOrgs: Array.from(this.orgCaches.keys())
                });
                const minimalOrg: Organization = {
                    id: organizationId,
                    name: organizationId,
                    slug: organizationId,
                    providers: [],
                    applications: []
                };
                this.set(minimalOrg);
                orgCache = this.get(organizationId);

                if (!orgCache) {
                    logger.error(`Failed to create organization cache for ${organizationId}, skipping application ${urlSlug}`);
                    continue;
                }
                logger.info(`Created minimal organization cache for ${organizationId}`);
            }

            logger.debug(`Setting application with key="${urlSlug}" (from field: ${app.urlSlug})`);
            orgCache.set('applications', app.urlSlug, app);
            logger.info(`Application ${urlSlug} added to organization ${organizationId} cache`, {
                organizationId,
                urlSlug,
                providerType: app.providerType,
                providerName: app.providerName
            });
        }
    }

    getApplication(orgId: string, urlSlug: string): Application | undefined {
        const orgCache = this.get(orgId);
        if (!orgCache) {
            logger.debug(`getApplication: org ${orgId} not found`);
            return undefined;
        }

        const app = orgCache.get('applications', urlSlug);
        logger.debug(`getApplication: orgId=${orgId}, urlSlug=${urlSlug}, found=${!!app}`, {
            urlSlug,
            appExists: orgCache.has('applications', urlSlug),
            allAppSlugs: orgCache.getAll('applications').map(a => a.urlSlug)
        });

        return app;
    }

    getAllApplications(orgId: string): Application[] | undefined {
        return this.get(orgId)?.getAll('applications');
    }

    getApplicationsByProvider(orgId: string, providerFamily: string) {
        return this.get(orgId)?.find('applications', 'providerType', providerFamily);
    }

    getProvider(orgId: string, providerName: string): Provider | undefined {
        return this.get(orgId)?.get('providers', providerName);
    }

    getAllProviders(orgId: string): Provider[] | undefined {
        return this.get(orgId)?.getAll('providers');
    }

    delApplication(orgId: string, urlSlug: string) {
        return this.get(orgId)?.del('applications', urlSlug);
    }

    delProvider(orgId: string, providerName: string) {
        return this.get(orgId)?.del('providers', providerName);
    }
}
