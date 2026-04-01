import OpenAI from 'openai';
import { env } from '../../config/env.js';
import type { AIProvider, AIMessage } from './ai.provider.js';
import { parseAIResponse, SYSTEM_PROMPT } from './ai.provider.js';
import type { AIQueryResponse } from '@lifevault/shared';

export class OpenAIAdapter implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async chat(messages: AIMessage[]): Promise<AIQueryResponse> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const raw = completion.choices[0].message.content ?? '{}';
    return parseAIResponse(raw);
  }
}
