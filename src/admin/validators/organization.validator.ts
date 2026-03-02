import {type, Type} from "arktype";
import {ApplicationValidator} from "./application.validator";
import {ProviderValidator} from "./provider.validator";
import {OrganizationConfigProps} from "@holokai/sdk";


export const OrganizationValidator = type({
    id: 'string',
    name: 'string',
    slug: 'string',
    providers: ProviderValidator.array(),
    applications: ApplicationValidator.array()
}) satisfies Type<OrganizationConfigProps>;
