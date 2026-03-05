import {type, Type} from "arktype";
import {ApplicationValidator} from "./application.validator";
import {ProviderValidator} from "./provider.validator";
import type {OrganizationConfigProps} from "@holokai/types/config";


export const OrganizationValidator = type({
    id: 'string',
    name: 'string',
    slug: 'string',
    providers: ProviderValidator.array(),
    applications: ApplicationValidator.array()
}) satisfies Type<OrganizationConfigProps>;
