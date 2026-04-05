import { create } from 'zustand';
import { api } from '../lib/api';
import type { AIQueryResponse } from '@lifevault/shared';

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
  sessionId: string;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  reloadSession: () => void;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [],
  isLoading: false,
  sessionId: generateSessionId(),

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
        session_id: get().sessionId,
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

  reloadSession: () => {
    set({ messages: [], sessionId: generateSessionId() });
  },
}));
