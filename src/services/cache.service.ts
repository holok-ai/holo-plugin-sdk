// services/cacheService.ts
import NodeCache from 'node-cache';
import {CacheType, User, AllCacheStats } from '../types/cache.types';
import { ApplicationConfig } from '../types/config.types';
import logger from '../utils/logger';

class CacheService {
  private caches: Record<CacheType, NodeCache>;

  constructor() {
    // Different cache instances for different data types
    this.caches = {
      users: new NodeCache({
        stdTTL: 600,        // 10 minutes
        checkperiod: 120,   // Check expired keys every 2 minutes
        useClones: false,   // Better performance, be careful with object mutations
        maxKeys: 1000       // Prevent memory issues
      }),
      tokens: new NodeCache({
        stdTTL: 3600,       // 1 hour - matches typical JWT expiration
        checkperiod: 300,   // Check expired keys every 5 minutes
        useClones: false,   // Better performance
        maxKeys: 5000       // Allow more tokens to be cached
      }),
      applications: new NodeCache({
        stdTTL: 0,       // Infinite
        checkperiod: 300,   // Check expired keys every 5 minutes
        useClones: false,   // Better performance
        maxKeys: 5000       // Allow more tokens to be cached
      }),
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    Object.entries(this.caches).forEach(([name, cache]) => {
      cache.on('set', (key: string, value: any) => {
        logger.debug(`[${name}] Cache SET: ${key} value: ${value}`);
      });

      cache.on('expired', (key: string) => {
        logger.debug(`[${name}] Cache EXPIRED: ${key}`);
      });

      cache.on('del', (key: string) => {
        logger.debug(`[${name}] Cache DELETE: ${key}`);
      });
    });
  }

  // Generic cache operations
  get<T = any>(cacheType: CacheType, key: string): T | undefined {
    return this.caches[cacheType]?.get<T>(key);
  }

  set<T = any>(cacheType: CacheType, key: string, value: T): boolean {
    return this.caches[cacheType]?.set(key, value) ?? false;
  }

  del(cacheType: CacheType, key: string): number {
    return this.caches[cacheType]?.del(key) ?? 0;
  }

  flush(cacheType: CacheType): void {
    this.caches[cacheType]?.flushAll();
  }

  // Specific cache operations
  getUser(userId: string): User | undefined {
    return this.get<User>('users', `user:${userId}`);
  }

  setUser(userId: string, userData: User): boolean {
    return this.set('users', `user:${userId}`, userData);
  }

  getTokenUrlSlugs(jwtToken: string): string[] | undefined {
    const data = this.get<{urlSlugs: string[]}>('tokens', `token:${jwtToken}`);
    return data?.urlSlugs;
  }

  setTokenUrlSlugs(jwtToken: string, urlSlugs: string[]): boolean {
    return this.set('tokens', `token:${jwtToken}`, { urlSlugs, cachedAt: Date.now() });
  }

  hasToken(jwtToken: string): boolean {
    return this.has('tokens', `token:${jwtToken}`);
  }

  // Application cache operations
  setApplications(applications: ApplicationConfig[]): boolean {
    let allSucceeded = true;
    
    applications.forEach(app => {
      const success = this.set('applications', app.urlSlug, app);
      if (!success) {
        logger.error(`Failed to cache application with urlSlug: ${app.urlSlug}`);
        allSucceeded = false;
      } else {
        logger.debug(`Cached application with urlSlug: ${app.urlSlug}`);
      }
    });
    
    return allSucceeded;
  }

  getApplication(urlSlug: string): ApplicationConfig | undefined {
    return this.get<ApplicationConfig>('applications', urlSlug);
  }
  
  removeApplication(urlSlug: string): boolean {
    const removed = this.del('applications', urlSlug);
    if (removed > 0) {
      logger.debug(`Removed application from cache: ${urlSlug}`);
      return true;
    }
    return false;
  }

  getAllApplications(): ApplicationConfig[] {
    const keys = this.getKeys('applications');
    const applications: ApplicationConfig[] = [];
    
    keys.forEach(urlSlug => {
      const app = this.getApplication(urlSlug);
      if (app) {
        applications.push(app);
      }
    });
    
    return applications;
  }

  // Stats for monitoring
  getStats(): AllCacheStats {
    const stats: AllCacheStats = {};
    Object.entries(this.caches).forEach(([name, cache]) => {
      stats[name] = {
        ...cache.getStats(),
        keys: cache.keys().length
      };
    });
    return stats;
  }

  // Get keys for a specific cache type
  getKeys(cacheType: CacheType): string[] {
    return this.caches[cacheType]?.keys() ?? [];
  }

  // Check if key exists
  has(cacheType: CacheType, key: string): boolean {
    return this.caches[cacheType]?.has(key) ?? false;
  }

  // Graceful shutdown
  close(): void {
    Object.values(this.caches).forEach(cache => cache.close());
  }
}

export default new CacheService();