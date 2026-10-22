import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3124),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    // Optional: without it, caching is disabled and rate limits are kept in memory
    REDIS_URL: z.string().optional(),
    // Comma-separated list of allowed origins; unset allows all
    CORS_ORIGIN: z.string().optional(),
    // Number of proxies in front of the app (e.g. 1 on Render/Railway), so req.ip is the real client
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
    SHORTEN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
    API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
    process.exit(1);
}

export const env = parsed.data;
