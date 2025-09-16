// types/cache.types.ts
import { Stats } from 'node-cache';

export interface CacheConfig {
  stdTTL: number;
  checkperiod: number;
  useClones: boolean;
  maxKeys: number;
}

export interface CacheConfigs {
  users: CacheConfig;
  tokens: CacheConfig;
  applications: CacheConfig;
}

export interface CacheStats extends Stats {
  keys: number;
}

export interface AllCacheStats {
  [cacheType: string]: CacheStats;
}

export type CacheType = keyof CacheConfigs;

export interface User {
  id: string;
  appAccess: [hexCodes: string];
  // Add other user properties as needed
}

