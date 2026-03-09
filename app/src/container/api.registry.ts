import {container} from 'tsyringe';
import {AccessDB, HoloTokenDB, ProviderDB} from '../db';
import {
    AccessService,
    ApplicationService,
    HoloTokenService,
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
    .registerSingleton(ApplicationService);
