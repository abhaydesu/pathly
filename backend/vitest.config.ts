import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        setupFiles: ['./tests/setup.ts'],
        // The real connection string comes from mongodb-memory-server in tests/setup.ts
        env: {
            NODE_ENV: 'test',
            MONGODB_URI: 'mongodb://set-by-test-setup',
            LOG_LEVEL: 'silent',
            SHORTEN_RATE_LIMIT_PER_MINUTE: '5',
        },
        hookTimeout: 120_000,
    },
});
