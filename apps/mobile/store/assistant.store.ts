import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AIQueryResponse } from '@lifevault/shared';

const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL
  ?? 'https://n8n-pmv-playground.up.railway.app/webhook/lifevault-chatbot';

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
  clearHistory: () => void;
  reloadSession: () => void;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [],
  isLoading: false,
  sessionId: generateSessionId(),

  sendMessage: async (text) => {
    const { data: { user } } = await supabase.auth.getUser();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    set((state) => ({ messages: [...state.messages, userMessage], isLoading: true }));

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:    user?.id ?? '',
          message:    text,
          session_id: get().sessionId,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const raw = await res.text();
      let response: AIQueryResponse;

      try {
        const parsed = JSON.parse(raw);
        response = {
          message:     parsed.message ?? raw,
          actions:     Array.isArray(parsed.actions)     ? parsed.actions     : [],
          attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        };
      } catch {
        response = { message: raw, actions: [], attachments: [] };
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        response,
        createdAt: new Date(),
      };

      set((state) => ({ messages: [...state.messages, assistantMessage] }));
    } catch {
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

  clearHistory: () => {
    set({ messages: [] });
  },

  reloadSession: () => {
    set({ messages: [], sessionId: generateSessionId() });
  },
}));
