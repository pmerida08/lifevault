import { create } from 'zustand';
import { api } from '../lib/api';
import type { AIQueryResponse } from '@lifevault/shared';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AIQueryResponse;
  createdAt: Date;
}

interface AssistantState {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [],
  isLoading: false,

  sendMessage: async (text) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    set((state) => ({ messages: [...state.messages, userMessage], isLoading: true }));

    try {
      const response = await api.post<AIQueryResponse>('/assistant/query', {
        message: text,
        context: { include_tasks: true, include_events: true },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        response,
        createdAt: new Date(),
      };

      set((state) => ({ messages: [...state.messages, assistantMessage] }));
    } catch (err) {
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, no pude procesar tu solicitud. Por favor intenta de nuevo.',
        createdAt: new Date(),
      };
      set((state) => ({ messages: [...state.messages, errMessage] }));
    } finally {
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    await api.delete('/assistant/history');
    set({ messages: [] });
  },
}));
