import { env } from '../../config/env.js';
import type { AIProvider, AIMessage, AIProviderContext } from './ai.provider.js';
import { parseAIResponse } from './ai.provider.js';
import type { AIQueryResponse } from '@lifevault/shared';

export class N8nAdapter implements AIProvider {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = env.N8N_WEBHOOK_URL!;
  }

  async chat(messages: AIMessage[], context?: AIProviderContext): Promise<AIQueryResponse> {
    // Extract the last user message as the actual query
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const message = lastUserMessage?.content ?? '';

    const payload = {
      user_id: context?.userId ?? '',
      message,
      session_id: context?.sessionId ?? context?.userId ?? '',
    };

    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`n8n webhook error: ${res.status} ${res.statusText}`);
    }

    const raw = await res.text();
    return parseAIResponse(raw);
  }
}
