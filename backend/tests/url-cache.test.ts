import RedisMock from 'ioredis-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Redis } from 'ioredis';
import { createUrlCache } from '../src/services/url-cache.js';
import { createUrlService } from '../src/services/url.service.js';
import { Url } from '../src/models/url.model.js';

let redis: Redis;

beforeEach(async () => {
    redis = new RedisMock() as unknown as Redis;
    await redis.flushall();
});

describe('redirect cache', () => {
    it('serves repeat lookups from Redis instead of MongoDB', async () => {
        const service = createUrlService({ cache: createUrlCache(redis, 3600) });
        await Url.create({ originalUrl: 'https://example.com', shortId: 'cached1' });

        expect(await service.resolve('cached1')).toMatchObject({ originalUrl: 'https://example.com' });

        // Remove it from MongoDB: the next lookup can only succeed via the cache
        await Url.deleteMany({});
        expect(await service.resolve('cached1')).toMatchObject({ originalUrl: 'https://example.com' });
        expect(await redis.ttl('url:cached1')).toBe(3600);
    });

    it('caps the cache TTL at the link expiry', async () => {
        const service = createUrlService({ cache: createUrlCache(redis, 3600) });
        await Url.create({ originalUrl: 'https://example.com', shortId: 'soon', expiresAt: new Date(Date.now() + 60_000) });

        await service.resolve('soon');

        const ttl = await redis.ttl('url:soon');
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(60);
    });

    it('falls back to MongoDB when Redis is unavailable', async () => {
        vi.spyOn(redis, 'get').mockRejectedValue(new Error('Connection is closed.'));
        vi.spyOn(redis, 'set').mockRejectedValue(new Error('Connection is closed.'));
        const service = createUrlService({ cache: createUrlCache(redis, 3600) });
        await Url.create({ originalUrl: 'https://example.com', shortId: 'nocache' });

        expect(await service.resolve('nocache')).toMatchObject({ originalUrl: 'https://example.com' });
    });
});
