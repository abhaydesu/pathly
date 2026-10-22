import { rateLimit } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import type { Redis } from 'ioredis';

// Counters live in Redis when it's available, so limits hold across multiple
// app instances. Without Redis each instance keeps its own in-memory counters.
export function createRateLimiter({ name, limitPerMinute, redis }: { name: string; limitPerMinute: number; redis: Redis | null }) {
    return rateLimit({
        windowMs: 60 * 1000,
        limit: limitPerMinute,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later.' },
        // If Redis is down, let requests through rather than taking the API down with it
        passOnStoreError: true,
        store: redis
            ? new RedisStore({
                  prefix: `rl:${name}:`,
                  sendCommand: (command: string, ...args: string[]) =>
                      redis.call(command, ...args) as Promise<RedisReply>,
              })
            : undefined,
    });
}
