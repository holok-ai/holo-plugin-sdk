import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {CacheService} from "./cache.service";
import {Organization} from "../../cache/types";

@injectable()
export class OrganizationService {
    constructor(
        private cacheService: CacheService,
    ) {
    }

    cacheOrganizations(organizations: Organization[]) {
        return this.cacheService.setAll("organizations", organizations, "id");
    }

    getOrganization(id: string): Organization | undefined {
        return this.cacheService.get("organizations", id);
    }

    getProvider()
}
