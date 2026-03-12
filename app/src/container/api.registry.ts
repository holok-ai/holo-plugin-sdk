import {container} from 'tsyringe';
import {
    AccessDB, ApplicationDB, HoloTokenDB, ModelDB, PricingDB,
    ProviderDB, ProviderResponseCostDB, RequestDB, ResponseDB
} from '../db';
import {
    AccessService,
    ApplicationService,
    HoloTokenService,
    PricingService,
    ResponseService,
    TokenService
} from '../services';

container
    .registerSingleton(ResponseService)
    .registerSingleton(TokenService)
    .registerSingleton(HoloTokenDB)
    .registerSingleton(HoloTokenService)
    .registerSingleton(ProviderDB)
    .registerSingleton(AccessDB)
    .registerSingleton(AccessService)
    .registerSingleton(ApplicationService)
    .registerSingleton(ApplicationDB)
    .registerSingleton(ModelDB)
    .registerSingleton(RequestDB)
    .registerSingleton(ResponseDB)
    .registerSingleton(PricingDB)
    .registerSingleton(ProviderResponseCostDB)
    .registerSingleton(PricingService);
