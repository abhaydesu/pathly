import { Redis } from 'ioredis';
import { logger } from './logger.js';

export async function connectRedis(url: string) {
    const redis = new Redis(url, {
        lazyConnect: true,
        // Fail fast instead of queueing commands while Redis is down,
        // so callers can fall back to MongoDB instead of hanging
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
    });

    redis.on('error', (err) => logger.warn({ err }, 'Redis error'));
    await redis.connect();
    logger.info('Redis connected');

    return redis;
}
