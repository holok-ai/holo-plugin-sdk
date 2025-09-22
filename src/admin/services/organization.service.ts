import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {OrganizationCacheService} from "./organization.cache.service";
import {Application, OrganizationCache, Provider} from "../../cache";

@injectable()
export class OrganizationService {
    constructor(
        private orgCacheService: OrganizationCacheService,
    ) {
    }

    withOrganization(orgId: string): OrganizationCache | undefined {
        return this.orgCacheService.get(orgId);
    }

    getApplication(orgId: string, appId: string): Application | undefined {
        return this.orgCacheService.getApplication(orgId, appId);
    }

    getProvider(orgId: string, providerId: string): Provider | undefined {
        return this.orgCacheService.getProvider(orgId, providerId);
    }
}
