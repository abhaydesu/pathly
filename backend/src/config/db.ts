import mongoose from 'mongoose';
import { logger } from '../lib/logger.js';

export async function connectDB(uri: string) {
    const conn = await mongoose.connect(uri);
    logger.info({ host: conn.connection.host }, 'MongoDB connected');
}

export async function disconnectDB() {
    await mongoose.disconnect();
}
