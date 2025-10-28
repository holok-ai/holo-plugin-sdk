import {Stats} from "node-cache";

export interface CacheStats extends Stats {
    keys: number;
}

export interface AllCacheStats {
    [cacheType: string]: CacheStats;
}
