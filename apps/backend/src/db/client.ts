import { Pool } from 'pg';
import { env } from '../config/env.js';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

db.on('error', (err) => {
  console.error('Unexpected DB error:', err);
});

export async function connectDB(): Promise<void> {
  const client = await db.connect();
  client.release();
  console.log('PostgreSQL connected');
}
