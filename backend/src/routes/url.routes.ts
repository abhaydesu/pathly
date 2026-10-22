import { Router, type RequestHandler } from 'express';
import type { createUrlController } from '../controllers/url.controller.js';

type UrlController = ReturnType<typeof createUrlController>;

export function createUrlRouter(controller: UrlController, { shortenLimiter }: { shortenLimiter: RequestHandler }) {
    const router = Router();

    router.post('/shorten', shortenLimiter, controller.shorten);
    router.get('/analytics/:shortId', controller.analytics);

    return router;
}
