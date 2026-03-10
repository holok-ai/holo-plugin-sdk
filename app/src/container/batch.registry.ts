import 'reflect-metadata';
import {container} from 'tsyringe';
import {PricingDB, ProviderResponseCostDB, ProviderDB} from '../db';
import {PricingService} from '../services';

container
    .registerSingleton(PricingDB)
    .registerSingleton(ProviderResponseCostDB)
    .registerSingleton(ProviderDB)
    .registerSingleton(PricingService);
