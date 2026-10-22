import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { Url } from '../src/models/url.model.js';

let app: Express;

beforeEach(() => {
    app = createApp();
});

const shorten = (body: object) => request(app).post('/api/shorten').send(body);
const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('POST /api/shorten', () => {
    it('creates a short link', async () => {
        const res = await shorten({ originalUrl: 'https://example.com/page' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ originalUrl: 'https://example.com/page', clicks: 0 });
        expect(res.body.shortId).toMatch(/^[A-Za-z0-9_-]{7}$/);
    });

    it('reuses the existing link for the same URL', async () => {
        const first = await shorten({ originalUrl: 'https://example.com' });
        const second = await shorten({ originalUrl: 'https://example.com' });

        expect(second.status).toBe(200);
        expect(second.body.shortId).toBe(first.body.shortId);
    });

    it('reuses links created before isCustomAlias existed', async () => {
        await Url.collection.insertOne({ originalUrl: 'https://legacy.com', shortId: 'legacy1', clicks: 0, createdAt: new Date() });
        const res = await shorten({ originalUrl: 'https://legacy.com' });

        expect(res.status).toBe(200);
        expect(res.body.shortId).toBe('legacy1');
    });

    it.each([
        [{}, 'Original URL is required'],
        [{ originalUrl: '' }, 'Original URL is required'],
        [{ originalUrl: 'not a url' }, 'Original URL must be a valid http(s) URL'],
        [{ originalUrl: 'javascript:alert(1)' }, 'Original URL must be a valid http(s) URL'],
        [{ originalUrl: 'ftp://example.com' }, 'Original URL must be a valid http(s) URL'],
    ])('rejects invalid input %j', async (body, error) => {
        const res = await shorten(body);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(error);
    });

    it('rejects malformed JSON', async () => {
        const res = await request(app)
            .post('/api/shorten')
            .set('Content-Type', 'application/json')
            .send('{"originalUrl":');

        expect(res.status).toBe(400);
    });
});

describe('custom aliases', () => {
    it('creates a link with the requested alias', async () => {
        const res = await shorten({ originalUrl: 'https://example.com', customAlias: 'my-link' });

        expect(res.status).toBe(201);
        expect(res.body.shortId).toBe('my-link');

        const redirect = await request(app).get('/my-link');
        expect(redirect.status).toBe(302);
    });

    it('returns 409 when the alias is taken', async () => {
        await shorten({ originalUrl: 'https://example.com', customAlias: 'taken' });
        const res = await shorten({ originalUrl: 'https://other.com', customAlias: 'taken' });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('This alias is already taken');
    });

    it.each(['ab', 'has space', 'a/b', 'x'.repeat(31)])('rejects invalid alias %j', async (customAlias) => {
        const res = await shorten({ originalUrl: 'https://example.com', customAlias });
        expect(res.status).toBe(400);
    });

    it.each(['api', 'API', 'health'])('rejects reserved alias %j', async (customAlias) => {
        const res = await shorten({ originalUrl: 'https://example.com', customAlias });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('This alias is reserved');
    });
});

describe('link expiry', () => {
    it('stores the expiry date', async () => {
        const expiresAt = inOneHour();
        const res = await shorten({ originalUrl: 'https://example.com', expiresAt });

        expect(res.status).toBe(201);
        expect(res.body.expiresAt).toBe(expiresAt);
    });

    it('rejects an expiry in the past', async () => {
        const res = await shorten({ originalUrl: 'https://example.com', expiresAt: '2020-01-01T00:00:00Z' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Expiry must be in the future');
    });

    it('does not reuse an expiring link for a permanent request', async () => {
        const expiring = await shorten({ originalUrl: 'https://example.com', expiresAt: inOneHour() });
        const permanent = await shorten({ originalUrl: 'https://example.com' });

        expect(permanent.status).toBe(201);
        expect(permanent.body.shortId).not.toBe(expiring.body.shortId);
    });

    it('stops redirecting once expired, even before the TTL monitor deletes it', async () => {
        await Url.create({ originalUrl: 'https://example.com', shortId: 'expired', expiresAt: new Date(Date.now() - 1000) });

        const res = await request(app).get('/expired');
        expect(res.status).toBe(404);
    });
});

describe('GET /:shortId', () => {
    it('redirects to the original URL with a 302', async () => {
        const { body } = await shorten({ originalUrl: 'https://example.com/target' });
        const res = await request(app).get(`/${body.shortId}`);

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('https://example.com/target');
    });

    it('returns 404 for unknown or malformed short IDs', async () => {
        expect((await request(app).get('/nope123')).status).toBe(404);
        expect((await request(app).get('/favicon.ico')).status).toBe(404);
    });

    it('counts concurrent clicks without losing updates', async () => {
        const { body } = await shorten({ originalUrl: 'https://example.com' });

        await Promise.all(Array.from({ length: 20 }, () => request(app).get(`/${body.shortId}`)));

        // Clicks are recorded after the redirect is sent, so wait for the writes to land
        await vi.waitFor(async () => {
            const url = await Url.findOne({ shortId: body.shortId });
            expect(url?.clicks).toBe(20);
        });
    });
});

describe('GET /api/analytics/:shortId', () => {
    it('returns total clicks and clicks per day', async () => {
        const { body } = await shorten({ originalUrl: 'https://example.com' });
        await request(app).get(`/${body.shortId}`);
        await request(app).get(`/${body.shortId}`);

        await vi.waitFor(async () => {
            const res = await request(app).get(`/api/analytics/${body.shortId}`);
            const today = new Date().toISOString().slice(0, 10);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ totalClicks: 2, clicksOverTime: [{ _id: today, count: 2 }] });
        });
    });

    it('returns 404 for unknown links', async () => {
        const res = await request(app).get('/api/analytics/missing');
        expect(res.status).toBe(404);
    });
});

describe('rate limiting', () => {
    it('limits link creation per client', async () => {
        // SHORTEN_RATE_LIMIT_PER_MINUTE is 5 in vitest.config.ts
        for (let i = 0; i < 5; i++) {
            expect((await shorten({ originalUrl: `https://example.com/${i}` })).status).toBe(201);
        }

        const res = await shorten({ originalUrl: 'https://example.com/6' });
        expect(res.status).toBe(429);
        expect(res.body.error).toBe('Too many requests, please try again later.');
        expect(res.headers).toHaveProperty('ratelimit');
    });
});

describe('GET /health', () => {
    it('reports ok when the database is connected', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });
});
