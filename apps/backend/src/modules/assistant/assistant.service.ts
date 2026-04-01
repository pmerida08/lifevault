import { db } from '../../db/client.js';
import { getAIProvider } from '../../services/ai/ai.factory.js';
import type { AIMessage } from '../../services/ai/ai.provider.js';
import type { AIQueryResponse } from '@lifevault/shared';
import type { AssistantQueryInput } from './assistant.schema.js';

export async function queryAssistant(
  userId: string,
  input: AssistantQueryInput
): Promise<AIQueryResponse> {
  const contextParts: string[] = [];

  // Load recent tasks
  if (input.context?.include_tasks !== false) {
    const { rows } = await db.query(
      `SELECT title, status, priority, due_date FROM tasks
       WHERE user_id = $1 AND status != 'done'
       ORDER BY priority DESC, due_date ASC NULLS LAST LIMIT 10`,
      [userId]
    );
    if (rows.length > 0) {
      contextParts.push(`PENDING TASKS:\n${rows.map((t) =>
        `- [${t.priority}] ${t.title} (${t.status})${t.due_date ? ` — due ${new Date(t.due_date).toLocaleDateString()}` : ''}`
      ).join('\n')}`);
    }
  }

  // Load upcoming events
  if (input.context?.include_events !== false) {
    const { rows } = await db.query(
      `SELECT title, description, start_at, all_day FROM events
       WHERE user_id = $1 AND start_at >= NOW()
       ORDER BY start_at ASC LIMIT 10`,
      [userId]
    );
    if (rows.length > 0) {
      contextParts.push(`UPCOMING EVENTS:\n${rows.map((e) =>
        `- ${e.title} on ${new Date(e.start_at).toLocaleDateString()}${e.description ? `: ${e.description}` : ''}`
      ).join('\n')}`);
    }
  }

  // Load specific documents if requested
  if (input.context?.document_ids?.length) {
    const { rows } = await db.query(
      `SELECT title, category, notes, tags FROM documents
       WHERE user_id = $1 AND id = ANY($2)`,
      [userId, input.context.document_ids]
    );
    if (rows.length > 0) {
      contextParts.push(`REFERENCED DOCUMENTS:\n${rows.map((d) =>
        `- [${d.category}] ${d.title}${d.notes ? `: ${d.notes}` : ''} (tags: ${d.tags.join(', ')})`
      ).join('\n')}`);
    }
  }

  // Build message history from DB
  const { rows: history } = await db.query(
    `SELECT role, content FROM ai_messages
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [userId]
  );

  const messages: AIMessage[] = [
    ...(contextParts.length > 0
      ? [{ role: 'user' as const, content: `VAULT CONTEXT:\n\n${contextParts.join('\n\n')}` },
         { role: 'assistant' as const, content: '{"message": "I have loaded your vault context.", "actions": [], "attachments": []}' }]
      : []),
    ...history.reverse().map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: input.message },
  ];

  const ai = getAIProvider();
  const response = await ai.chat(messages);

  // Persist both messages
  await db.query(
    `INSERT INTO ai_messages (user_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
    [userId, input.message, response.message]
  );

  return response;
}

export async function getConversationHistory(userId: string, limit = 50) {
  const { rows } = await db.query(
    `SELECT id, role, content, metadata, created_at FROM ai_messages
     WHERE user_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export async function clearConversation(userId: string): Promise<void> {
  await db.query('DELETE FROM ai_messages WHERE user_id = $1', [userId]);
}
