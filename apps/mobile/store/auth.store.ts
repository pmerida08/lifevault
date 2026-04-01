import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import type { User } from '@lifevault/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  hydrate: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) { set({ isLoading: false }); return; }
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, token, isLoading: false });
    } catch {
      await AsyncStorage.removeItem('auth_token');
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { user, token } = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    await AsyncStorage.setItem('auth_token', token);
    set({ user, token });
  },

  register: async (email, password, name) => {
    const { user, token } = await api.post<{ user: User; token: string }>('/auth/register', { email, password, name });
    await AsyncStorage.setItem('auth_token', token);
    set({ user, token });
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ user: null, token: null });
  },
}));
