import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { SHORT_ID_PATTERN, shortenSchema } from '../schemas/url.schema.js';
import type { UrlService } from '../services/url.service.js';

// Express 5 forwards rejected promises to the error handler, so no try/catch is needed here
export function createUrlController(urlService: UrlService) {
    async function shorten(req: Request, res: Response) {
        const input = shortenSchema.parse(req.body ?? {});
        const { url, created } = await urlService.shorten(input);
        res.status(created ? 201 : 200).json(url);
    }

    async function redirect(req: Request<{ shortId: string }>, res: Response) {
        const { shortId } = req.params;
        const url = SHORT_ID_PATTERN.test(shortId) ? await urlService.resolve(shortId) : null;
        if (!url) throw new AppError(404, 'No URL found');

        // 302 rather than 301: browsers cache 301s and would skip us on repeat visits,
        // which would hide those clicks from analytics.
        // Redirect first so the user isn't kept waiting on analytics writes.
        res.redirect(302, url.originalUrl);

        urlService.recordClick(url.id).catch((err) => {
            req.log.error({ err, shortId }, 'Failed to record click');
        });
    }

    async function analytics(req: Request<{ shortId: string }>, res: Response) {
        res.json(await urlService.getAnalytics(req.params.shortId));
    }

    return { shorten, redirect, analytics };
}
