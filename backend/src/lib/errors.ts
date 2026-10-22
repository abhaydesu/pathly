import mongoose from 'mongoose';

export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function isDuplicateKeyError(err: unknown, field: string) {
    return (
        err instanceof mongoose.mongo.MongoServerError &&
        err.code === 11000 &&
        field in (err.keyPattern ?? {})
    );
}
