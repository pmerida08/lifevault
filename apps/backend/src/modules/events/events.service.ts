import { db } from '../../db/client.js';
import type { Event } from '@lifevault/shared';
import type { CreateEventInput, UpdateEventInput, EventQuery } from './events.schema.js';

export async function listEvents(userId: string, query: EventQuery): Promise<{ rows: Event[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;

  if (query.from) { conditions.push(`start_at >= $${idx++}`); params.push(query.from); }
  if (query.to)   { conditions.push(`start_at <= $${idx++}`); params.push(query.to); }

  const where = conditions.join(' AND ');
  const { rows: [{ count }] } = await db.query(`SELECT COUNT(*) FROM events WHERE ${where}`, params);
  params.push(query.limit, offset);

  const { rows } = await db.query<Event>(
    `SELECT * FROM events WHERE ${where} ORDER BY start_at ASC LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );
  return { rows, total: parseInt(count, 10) };
}

export async function getEvent(id: string, userId: string): Promise<Event | null> {
  const { rows } = await db.query<Event>(
    'SELECT * FROM events WHERE id = $1 AND user_id = $2', [id, userId]
  );
  return rows[0] ?? null;
}

export async function createEvent(userId: string, input: CreateEventInput): Promise<Event> {
  const { rows } = await db.query<Event>(
    `INSERT INTO events (user_id, title, description, start_at, end_at, all_day, color, reminder_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, input.title, input.description ?? null, input.start_at, input.end_at ?? null,
     input.all_day, input.color, input.reminder_minutes ?? null]
  );
  return rows[0];
}

export async function updateEvent(id: string, userId: string, input: UpdateEventInput): Promise<Event | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const keys = ['title', 'description', 'start_at', 'end_at', 'all_day', 'color', 'reminder_minutes'] as const;
  for (const key of keys) {
    if (input[key] !== undefined) { fields.push(`${key} = $${idx++}`); params.push(input[key]); }
  }

  if (fields.length === 0) return getEvent(id, userId);
  params.push(id, userId);

  const { rows } = await db.query<Event>(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function deleteEvent(id: string, userId: string): Promise<boolean> {
  const result = await db.query('DELETE FROM events WHERE id = $1 AND user_id = $2', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
