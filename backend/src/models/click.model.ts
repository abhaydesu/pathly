import { Schema, model } from 'mongoose';

const clickSchema = new Schema(
    {
        urlId: {
            type: Schema.Types.ObjectId,
            ref: 'Url',
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false },
);

// Analytics queries filter by urlId and group/sort by timestamp
clickSchema.index({ urlId: 1, timestamp: 1 });

export const Click = model('Click', clickSchema);
