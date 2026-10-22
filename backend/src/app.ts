import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import type { Redis } from 'ioredis';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { createUrlCache } from './services/url-cache.js';
import { createUrlService } from './services/url.service.js';
import { createUrlController } from './controllers/url.controller.js';
import { createUrlRouter } from './routes/url.routes.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

export function createApp({ redis = null }: { redis?: Redis | null } = {}) {
    const app = express();

    app.set('trust proxy', env.TRUST_PROXY);
    app.use(pinoHttp({ logger }));
    app.use(cors(env.CORS_ORIGIN ? { origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) } : undefined));
    app.use(express.json({ limit: '10kb' }));

    const urlService = createUrlService({ cache: createUrlCache(redis, env.CACHE_TTL_SECONDS) });
    const urlController = createUrlController(urlService);

    app.get('/health', (_req, res) => {
        const dbUp = mongoose.connection.readyState === mongoose.ConnectionStates.connected;
        res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'unavailable' });
    });

    app.use(
        '/api',
        createRateLimiter({ name: 'api', limitPerMinute: env.API_RATE_LIMIT_PER_MINUTE, redis }),
        createUrlRouter(urlController, {
            shortenLimiter: createRateLimiter({ name: 'shorten', limitPerMinute: env.SHORTEN_RATE_LIMIT_PER_MINUTE, redis }),
        }),
    );

    app.get('/:shortId', urlController.redirect);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
