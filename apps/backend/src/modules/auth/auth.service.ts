import bcrypt from 'bcryptjs';
import { db } from '../../db/client.js';
import type { User } from '@lifevault/shared';
import type { RegisterInput, LoginInput } from './auth.schema.js';

export async function registerUser(input: RegisterInput): Promise<User> {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing.rowCount && existing.rowCount > 0) {
    const err = new Error('Email already in use') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(input.password, 10);

  const result = await db.query<User>(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, avatar_url, created_at`,
    [input.email, input.name, password_hash]
  );

  return result.rows[0];
}

export async function loginUser(input: LoginInput): Promise<User> {
  const result = await db.query<User & { password_hash: string }>(
    'SELECT id, email, name, avatar_url, created_at, password_hash FROM users WHERE email = $1',
    [input.email]
  );

  if (!result.rows[0]) {
    const err = new Error('Invalid credentials') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const { password_hash: _, ...safeUser } = user;
  return safeUser as User;
}

export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatar_url?: string;
}): Promise<User> {
  const existing = await db.query<User>(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE google_id = $1 OR email = $2',
    [profile.googleId, profile.email]
  );

  if (existing.rows[0]) {
    await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [
      profile.googleId,
      existing.rows[0].id,
    ]);
    return existing.rows[0];
  }

  const result = await db.query<User>(
    `INSERT INTO users (email, name, avatar_url, google_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, avatar_url, created_at`,
    [profile.email, profile.name, profile.avatar_url ?? null, profile.googleId]
  );
  return result.rows[0];
}
