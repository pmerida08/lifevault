import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import type { AIProvider, AIMessage } from './ai.provider.js';
import { parseAIResponse, SYSTEM_PROMPT } from './ai.provider.js';
import type { AIQueryResponse } from '@lifevault/shared';

export class ClaudeAdapter implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async chat(messages: AIMessage[]): Promise<AIQueryResponse> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return parseAIResponse(raw);
  }
}
