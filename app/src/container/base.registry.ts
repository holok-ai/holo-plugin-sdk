import 'reflect-metadata';
import {container} from 'tsyringe';
import {AppDB} from '../db';
import {
    CryptoService,
    NotificationService,
    PluginDiscoveryService,
    PluginLoaderService,
    PluginService,
    ProviderImplService,
    ProviderPluginService,
    ProviderService,
    RedisService
} from '../services';
import {NotificationServiceToken, NotificationStoreToken} from '@holokai/sdk/notification';
import {PostgresNotificationStore} from '../db/notification.db';
import {PluginPackageDB} from '../db/plugin.package.db';
import {PluginInstallerService} from '../services/plugin/plugin.installer.service';
import {PluginLifecycleService} from '../services/plugin/plugin.lifecycle.service';

container
    .registerSingleton(AppDB)
    .registerSingleton(RedisService)
    .registerSingleton(CryptoService)
    .registerSingleton(NotificationServiceToken, NotificationService)
    .registerSingleton(NotificationStoreToken, PostgresNotificationStore)
    .registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginService)
    .registerSingleton(ProviderImplService)
    .registerSingleton(ProviderService)
    .registerSingleton(PluginPackageDB)
    .registerSingleton(PluginInstallerService)
    .registerSingleton(PluginLifecycleService);
