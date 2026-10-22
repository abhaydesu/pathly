import { z } from 'zod';

// Paths at the root that a custom alias would shadow
const RESERVED_ALIASES = new Set(['api', 'health']);

export const SHORT_ID_PATTERN = /^[A-Za-z0-9_-]{1,30}$/;

const isHttpUrl = (value: string) => {
    try {
        const { protocol } = new URL(value);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
};

export const shortenSchema = z.object({
    originalUrl: z
        .string({ error: 'Original URL is required' })
        .trim()
        .min(1, 'Original URL is required')
        .max(2048, 'Original URL is too long')
        .refine(isHttpUrl, 'Original URL must be a valid http(s) URL'),
    customAlias: z
        .string()
        .regex(/^[A-Za-z0-9_-]{3,30}$/, 'Alias must be 3-30 characters: letters, numbers, - or _')
        .refine((alias) => !RESERVED_ALIASES.has(alias.toLowerCase()), 'This alias is reserved')
        .optional(),
    expiresAt: z.coerce
        .date({ error: 'Expiry must be a valid date' })
        .refine((date) => date.getTime() > Date.now(), 'Expiry must be in the future')
        .optional(),
});

export type ShortenInput = z.infer<typeof shortenSchema>;
