import { create } from 'zustand';
import { api } from '../lib/api';
import type { Document } from '@lifevault/shared';

interface VaultState {
  documents: Document[];
  total: number;
  isLoading: boolean;
  selectedCategory: string | null;
  fetchDocuments: (category?: string, search?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setCategory: (category: string | null) => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  documents: [],
  total: 0,
  isLoading: false,
  selectedCategory: null,

  fetchDocuments: async (category, search) => {
    set({ isLoading: true });
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const query = params.toString() ? `?${params}` : '';

    try {
      const docs = await api.get<Document[]>(`/documents${query}`);
      const unique = Array.isArray(docs)
        ? [...new Map(docs.map(d => [d.document_id ?? d.id, d])).values()]
        : [];
      set({ documents: unique });
    } catch {
      set({ documents: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDocument: async (id) => {
    await api.delete(`/documents/${id}`);
    set((state) => ({
      documents: state.documents.filter((d) => d.document_id !== id),
      total: state.total - 1,
    }));
  },

  setCategory: (category) => set({ selectedCategory: category }),
}));
