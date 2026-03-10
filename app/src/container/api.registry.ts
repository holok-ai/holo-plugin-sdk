import {container} from 'tsyringe';
import {AccessDB, HoloTokenDB, PricingDB, ProviderDB, ProviderResponseCostDB} from '../db';
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
    .registerSingleton(PricingDB)
    .registerSingleton(ProviderResponseCostDB)
    .registerSingleton(PricingService);
