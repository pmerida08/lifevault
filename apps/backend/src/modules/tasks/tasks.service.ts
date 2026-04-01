import { db } from '../../db/client.js';
import type { Task } from '@lifevault/shared';
import type { CreateTaskInput, UpdateTaskInput, TaskQuery } from './tasks.schema.js';

export async function listTasks(
  userId: string,
  query: TaskQuery
): Promise<{ rows: Task[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;

  if (query.status) { conditions.push(`status = $${idx++}`); params.push(query.status); }
  if (query.priority) { conditions.push(`priority = $${idx++}`); params.push(query.priority); }

  const where = conditions.join(' AND ');
  const { rows: [{ count }] } = await db.query(`SELECT COUNT(*) FROM tasks WHERE ${where}`, params);
  params.push(query.limit, offset);

  const result = await db.query<Task>(
    `SELECT * FROM tasks WHERE ${where} ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      due_date ASC NULLS LAST, created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );

  return { rows: result.rows, total: parseInt(count, 10) };
}

export async function getTask(id: string, userId: string): Promise<Task | null> {
  const { rows } = await db.query<Task>(
    'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const { rows } = await db.query<Task>(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, input.title, input.description ?? null, input.status, input.priority, input.due_date ?? null, input.tags]
  );
  return rows[0];
}

export async function updateTask(id: string, userId: string, input: UpdateTaskInput): Promise<Task | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const keys = ['title', 'description', 'status', 'priority', 'due_date', 'tags'] as const;
  for (const key of keys) {
    if (input[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(input[key]);
    }
  }

  if (fields.length === 0) return getTask(id, userId);
  params.push(id, userId);

  const { rows } = await db.query<Task>(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function deleteTask(id: string, userId: string): Promise<boolean> {
  const result = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
