import {type, Type} from "arktype";
import {Organization} from "../types";
import {ApplicationValidator} from "./application.validator";
import {ProviderValidator} from "./provider.validator";


export const OrganizationValidator = type({
    id: 'string',
    name: 'string',
    slug: 'string',
    providers: ProviderValidator.array(),
    applications: ApplicationValidator.array()
}) satisfies Type<Organization>;
