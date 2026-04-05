import type { AIQueryResponse } from '@lifevault/shared';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderContext {
  userId?: string;
  sessionId?: string;
}

export interface AIProvider {
  chat(messages: AIMessage[], context?: AIProviderContext): Promise<AIQueryResponse>;
}

export function parseAIResponse(raw: string): AIQueryResponse {
  try {
    const parsed = JSON.parse(raw);
    return {
      message: parsed.message ?? raw,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
    };
  } catch {
    return { message: raw, actions: [], attachments: [] };
  }
}

export const SYSTEM_PROMPT = `You are LifeVault AI — a private, intelligent assistant for managing personal documents, tasks, and life events.

You have access to the user's vault context provided in the conversation.
Always respond with a JSON object in this exact format:
{
  "message": "Your response here (markdown supported)",
  "actions": [
    { "type": "create_task|create_event|open_document|navigate", "payload": {}, "label": "Button label" }
  ],
  "attachments": [
    { "type": "document|task|event", "id": "uuid", "title": "Title" }
  ]
}

Be concise, helpful, and privacy-conscious. Never expose data that wasn't provided in the context.`;
