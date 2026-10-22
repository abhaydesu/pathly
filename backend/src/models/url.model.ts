import { Schema, model, type InferSchemaType } from 'mongoose';

const urlSchema = new Schema(
    {
        originalUrl: {
            type: String,
            required: true,
        },
        shortId: {
            type: String,
            required: true,
            unique: true,
        },
        isCustomAlias: {
            type: Boolean,
            default: false,
        },
        clicks: {
            type: Number,
            required: true,
            default: 0,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false },
);

// Lookup used to reuse an existing plain (non-custom, non-expiring) link for the same URL
urlSchema.index({ originalUrl: 1, isCustomAlias: 1, expiresAt: 1 });

// TTL index: MongoDB deletes the document once expiresAt has passed.
// Documents with expiresAt = null are never removed.
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UrlDoc = InferSchemaType<typeof urlSchema>;

export const Url = model('Url', urlSchema);
