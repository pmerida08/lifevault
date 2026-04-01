import { env } from '../../config/env.js';
import type { AIProvider } from './ai.provider.js';

let instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (instance) return instance;

  if (env.AI_PROVIDER === 'claude') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ClaudeAdapter } = require('./claude.adapter.js') as typeof import('./claude.adapter.js');
    instance = new ClaudeAdapter();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAIAdapter } = require('./openai.adapter.js') as typeof import('./openai.adapter.js');
    instance = new OpenAIAdapter();
  }

  return instance;
}
