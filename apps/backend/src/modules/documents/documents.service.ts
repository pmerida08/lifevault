import { db } from '../../db/client.js';
import type { Document } from '@lifevault/shared';
import type { CreateDocumentInput, UpdateDocumentInput, DocumentQuery } from './documents.schema.js';

export async function listDocuments(
  userId: string,
  query: DocumentQuery
): Promise<{ rows: Document[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  const conditions: string[] = ['user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;

  if (query.category) {
    conditions.push(`category = $${idx++}`);
    params.push(query.category);
  }
  if (query.search) {
    conditions.push(`(title ILIKE $${idx} OR notes ILIKE $${idx})`);
    params.push(`%${query.search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const countResult = await db.query(`SELECT COUNT(*) FROM document_summaries WHERE ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(query.limit, offset);
  const result = await db.query<Document>(
    `SELECT * FROM document_summaries WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );

  return { rows: result.rows, total };
}

export async function getDocument(id: string, userId: string): Promise<Document | null> {
  const result = await db.query<Document>(
    'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function createDocument(
  userId: string,
  input: CreateDocumentInput,
  file: { url: string; name: string; size: number; mimeType: string }
): Promise<Document> {
  const result = await db.query<Document>(
    `INSERT INTO documents (user_id, title, category, file_url, file_name, file_size, mime_type, tags, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, input.title, input.category, file.url, file.name, file.size, file.mimeType, input.tags, input.notes ?? null]
  );
  return result.rows[0];
}

export async function updateDocument(
  id: string,
  userId: string,
  input: UpdateDocumentInput
): Promise<Document | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (input.title !== undefined) { fields.push(`title = $${idx++}`); params.push(input.title); }
  if (input.category !== undefined) { fields.push(`category = $${idx++}`); params.push(input.category); }
  if (input.tags !== undefined) { fields.push(`tags = $${idx++}`); params.push(input.tags); }
  if (input.notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(input.notes); }

  if (fields.length === 0) return getDocument(id, userId);

  params.push(id, userId);
  const result = await db.query<Document>(
    `UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

export async function deleteDocument(documentId: string, userId: string): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM documents WHERE document_id = $1 AND user_id = $2',
    [documentId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
