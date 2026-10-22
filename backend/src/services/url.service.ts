import { nanoid } from 'nanoid';
import { Url } from '../models/url.model.js';
import { Click } from '../models/click.model.js';
import { AppError, isDuplicateKeyError } from '../lib/errors.js';
import type { ShortenInput } from '../schemas/url.schema.js';
import type { CachedUrl, UrlCache } from './url-cache.js';

const SHORT_ID_LENGTH = 7;
const MAX_SHORT_ID_ATTEMPTS = 5;

// MongoDB's TTL monitor only runs about once a minute, so expired links can
// still exist briefly. Check expiry ourselves rather than relying on deletion.
const isExpired = (url: CachedUrl) => url.expiresAt !== null && url.expiresAt <= Date.now();

export type UrlService = ReturnType<typeof createUrlService>;

export function createUrlService({ cache }: { cache: UrlCache }) {
    async function shorten({ originalUrl, customAlias, expiresAt }: ShortenInput) {
        if (customAlias) {
            try {
                const url = await Url.create({
                    originalUrl,
                    shortId: customAlias,
                    isCustomAlias: true,
                    expiresAt,
                });
                return { url, created: true };
            } catch (err) {
                if (isDuplicateKeyError(err, 'shortId')) {
                    throw new AppError(409, 'This alias is already taken');
                }
                throw err;
            }
        }

        // Reuse an existing permanent link for the same URL instead of creating duplicates
        if (!expiresAt) {
            // $ne also matches links created before isCustomAlias existed
            const existing = await Url.findOne({ originalUrl, isCustomAlias: { $ne: true }, expiresAt: null });
            if (existing) return { url: existing, created: false };
        }

        // nanoid collisions are rare but possible; the unique index catches them, so retry
        for (let attempt = 0; attempt < MAX_SHORT_ID_ATTEMPTS; attempt++) {
            try {
                const url = await Url.create({
                    originalUrl,
                    shortId: nanoid(SHORT_ID_LENGTH),
                    expiresAt,
                });
                return { url, created: true };
            } catch (err) {
                if (!isDuplicateKeyError(err, 'shortId')) throw err;
            }
        }

        throw new AppError(500, 'Could not generate a unique short ID');
    }

    async function resolve(shortId: string): Promise<CachedUrl | null> {
        const cached = await cache.get(shortId);
        if (cached) return isExpired(cached) ? null : cached;

        const doc = await Url.findOne({ shortId }).select('originalUrl expiresAt').lean();
        if (!doc) return null;

        const entry: CachedUrl = {
            id: doc._id.toString(),
            originalUrl: doc.originalUrl,
            expiresAt: doc.expiresAt ? doc.expiresAt.getTime() : null,
        };
        if (isExpired(entry)) return null;

        await cache.set(shortId, entry);
        return entry;
    }

    async function recordClick(urlId: string) {
        // $inc is atomic, so concurrent clicks can't overwrite each other's count
        await Promise.all([
            Url.updateOne({ _id: urlId }, { $inc: { clicks: 1 } }),
            Click.create({ urlId }),
        ]);
    }

    async function getAnalytics(shortId: string) {
        const url = await Url.findOne({ shortId }).select('clicks').lean();
        if (!url) throw new AppError(404, 'Url not found!');

        const clicksOverTime = await Click.aggregate<{ _id: string; count: number }>([
            { $match: { urlId: url._id } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return { totalClicks: url.clicks, clicksOverTime };
    }

    return { shorten, resolve, recordClick, getAnalytics };
}
