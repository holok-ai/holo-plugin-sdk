import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {Application, Organization, OrganizationCache, Provider} from "../../cache";
import {OrganizationConfigValidator} from "../validators";
import {HoloConfigAction, OrganizationConfig} from "../types";

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

    setOrganizations(organizations: Organization[]) {
        // as organizations and configurations scale, this is most performant
        for (let i = 0; i < organizations.length; i++) {
            this.set(organizations[i]);
        }
    }

    getApplication(orgId: string, urlSlug: string): Application | undefined {
        return this.get(orgId)?.get('applications', urlSlug);
    }

    getAllApplications(orgId: string): Application[] | undefined {
        return this.get(orgId)?.getAll('applications');
    }

    getProvider(orgId: string, providerId: string): Provider | undefined {
        return this.get(orgId)?.get('providers', providerId);
    }

    getAllProviders(orgId: string): Provider[] | undefined {
        return this.get(orgId)?.getAll('providers');
    }

    delApplication(orgId: string, appId: string | string[]) {
        return this.get(orgId)?.del('applications', appId);
    }

    delProvider(orgId: string, providerId: string | string[]) {
        return this.get(orgId)?.del('providers', providerId);
    }
}
