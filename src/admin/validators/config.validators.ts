import {type, type Type} from 'arktype';
import {
    ApplicationConfig,
    HoloConfig,
    HoloConfigAction,
    HoloConfigType,
    JwtTokenConfig,
    JwtTokenConfigData,
    OrganizationConfig
} from "@holokai/sdk";
import {OrganizationValidator} from "./organization.validator";
import {ApplicationValidator} from "./application.validator";

export const JwtTokenConfigDataValidator = type({
    'token?': 'string',
    'userId?': 'string',
    'organizationId?': 'string',
    '[string]': 'unknown'
}) satisfies Type<JwtTokenConfigData>;

export const OrganizationConfigValidator = type({
    configType: type('===', HoloConfigType.ORGANIZATION),
    action: type.valueOf(HoloConfigAction),
    data: OrganizationValidator.array()
}) satisfies Type<OrganizationConfig>;

export const ApplicationConfigValidator = type({
    configType: type('===', HoloConfigType.APPLICATION),
    action: type.valueOf(HoloConfigAction),
    data: ApplicationValidator.array()
}) satisfies Type<ApplicationConfig>;

export const JwtTokenConfigValidator = type({
    configType: type('===', HoloConfigType.JWT_TOKEN),
    action: type.valueOf(HoloConfigAction),
    data: JwtTokenConfigDataValidator.array()
}) satisfies Type<JwtTokenConfig>;

export const HoloConfigValidator =
    OrganizationConfigValidator
        .or(ApplicationConfigValidator)
        .or(JwtTokenConfigValidator) satisfies Type<HoloConfig>;
