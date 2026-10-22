import type { Redis } from 'ioredis';
import { logger } from '../lib/logger.js';

export type CachedUrl = {
    id: string;
    originalUrl: string;
    expiresAt: number | null;
};

export type UrlCache = {
    get(shortId: string): Promise<CachedUrl | null>;
    set(shortId: string, value: CachedUrl): Promise<void>;
};

const cacheKey = (shortId: string) => `url:${shortId}`;

// Cache-aside store for redirect lookups. Redis errors are logged and treated
// as a cache miss, so an outage degrades to MongoDB reads instead of failing redirects.
export function createUrlCache(redis: Redis | null, ttlSeconds: number): UrlCache {
    if (!redis) {
        return {
            get: async () => null,
            set: async () => {},
        };
    }

    return {
        async get(shortId) {
            try {
                const raw = await redis.get(cacheKey(shortId));
                return raw ? (JSON.parse(raw) as CachedUrl) : null;
            } catch (err) {
                logger.warn({ err, shortId }, 'Cache read failed');
                return null;
            }
        },

        async set(shortId, value) {
            // Never keep an expiring link in the cache past its expiry
            const secondsUntilExpiry = value.expiresAt
                ? Math.floor((value.expiresAt - Date.now()) / 1000)
                : Infinity;
            const ttl = Math.min(ttlSeconds, secondsUntilExpiry);
            if (ttl <= 0) return;

            try {
                await redis.set(cacheKey(shortId), JSON.stringify(value), 'EX', ttl);
            } catch (err) {
                logger.warn({ err, shortId }, 'Cache write failed');
            }
        },
    };
}
