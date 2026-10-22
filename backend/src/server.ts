import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis } from './lib/redis.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
    await connectDB(env.MONGODB_URI);

    const redis = env.REDIS_URL ? await connectRedis(env.REDIS_URL) : null;
    if (!redis) logger.warn('REDIS_URL not set: caching disabled, rate limits are per-instance');

    const server = createApp({ redis }).listen(env.PORT, () => {
        logger.info(`Server is running on ${env.PORT}`);
    });

    // Stop accepting connections, let in-flight requests finish, then close connections
    const shutdown = (signal: string) => {
        logger.info({ signal }, 'Shutting down');

        server.close(async () => {
            await Promise.allSettled([disconnectDB(), redis?.quit()]);
            process.exit(0);
        });

        setTimeout(() => {
            logger.error('Graceful shutdown timed out, forcing exit');
            process.exit(1);
        }, SHUTDOWN_TIMEOUT_MS).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
