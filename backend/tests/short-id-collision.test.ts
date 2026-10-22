import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { nanoid } from 'nanoid';
import { createApp } from '../src/app.js';

vi.mock('nanoid', () => ({ nanoid: vi.fn() }));

describe('short ID collisions', () => {
    it('retries with a new ID when the generated one already exists', async () => {
        vi.mocked(nanoid)
            .mockReturnValueOnce('AAAAAAA')
            .mockReturnValueOnce('AAAAAAA')
            .mockReturnValueOnce('BBBBBBB');
        const app = createApp();

        const first = await request(app).post('/api/shorten').send({ originalUrl: 'https://one.com' });
        const second = await request(app).post('/api/shorten').send({ originalUrl: 'https://two.com' });

        expect(first.body.shortId).toBe('AAAAAAA');
        expect(second.status).toBe(201);
        expect(second.body.shortId).toBe('BBBBBBB');
    });

    it('gives up after repeated collisions', async () => {
        vi.mocked(nanoid).mockReturnValue('CCCCCCC');
        const app = createApp();

        await request(app).post('/api/shorten').send({ originalUrl: 'https://one.com' });
        const res = await request(app).post('/api/shorten').send({ originalUrl: 'https://two.com' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Could not generate a unique short ID');
    });
});
