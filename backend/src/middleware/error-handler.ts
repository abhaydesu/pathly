import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export const notFound: RequestHandler = (_req, res) => {
    res.status(404).json({ error: 'Not found' });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: err.issues[0]?.message ?? 'Invalid request',
            details: err.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    // Errors raised by express.json() (malformed JSON, payload too large) carry a safe status
    if (typeof err?.status === 'number' && err.expose) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    req.log.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Server error' });
};
