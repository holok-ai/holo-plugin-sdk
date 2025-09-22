import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {Application, Organization, OrganizationCache, Provider, User} from "../../cache";
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

    get(id: string) {
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

    getApplication(orgId: string, appId: string): Application | undefined {
        return this.get(orgId)?.get<Application>('application', appId);
    }

    getProvider(orgId: string, providerId: string): Provider | undefined {
        return this.get(orgId)?.get<Provider>('provider', providerId);
    }

    getUser(orgId: string, userId: string): User | undefined {
        return this.get(orgId)?.get<User>('user', userId);
    }

    delApplication(orgId: string, appId: string | string[]) {
        return this.get(orgId)?.del('application', appId);
    }

    delProvider(orgId: string, providerId: string | string[]) {
        return this.get(orgId)?.del('provider', providerId);
    }

    delUser(orgId: string, userId: string | string[]) {
        return this.get(orgId)?.del('user', userId);
    }
}
