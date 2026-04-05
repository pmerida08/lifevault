import { create } from 'zustand';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';

interface Document {
  id: number;
  user_id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_url?: string;
  category: string;
  tags: string[];
  notes?: string;
  created_at: string;
}

interface VaultState {
  documents: Document[];
  isLoading: boolean;
  selectedCategory: string | null;
  fetchDocuments: (category?: string, search?: string) => Promise<void>;
  uploadDocument: (file: { uri: string; name: string; mimeType: string; size: number }, meta: { title: string; category: string; tags: string[] }) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  getDownloadUrl: (id: number) => Promise<string>;
  setCategory: (category: string | null) => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  documents: [],
  isLoading: false,
  selectedCategory: null,

  fetchDocuments: async (category, search) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      let query = supabase
        .from('documents')
        .select('id, user_id, title, file_name, file_size, file_url, category, tags, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (category) query = query.eq('category', category);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      // Deduplica por id
      const unique = [...new Map((data ?? []).map((d) => [d.id, d])).values()];
      set({ documents: unique });
    } catch {
      set({ documents: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (file, meta) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const fileExt = file.name.split('.').pop();
    const storagePath = `${user.id}/${Date.now()}-${file.name}`;

    // Sube el archivo a Supabase Storage
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, blob, { contentType: file.mimeType });

    if (uploadError) throw new Error(uploadError.message);

    // Obtiene la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    // Inserta el registro en la tabla documents
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: meta.title,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrl,
        storage_path: storagePath,
        category: meta.category,
        tags: meta.tags,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    set((state) => ({ documents: [data, ...state.documents] }));
  },

  deleteDocument: async (id) => {
    const doc = get().documents.find((d) => d.id === id);

    // Elimina de Storage si existe la ruta
    if (doc?.file_url) {
      const path = doc.file_url.split(`${STORAGE_BUCKET}/`)[1];
      if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    }

    await supabase.from('documents').delete().eq('id', id);
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
  },

  getDownloadUrl: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('documents')
      .select('file_url, storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw new Error('Documento no encontrado');

    // Si tiene storage_path, genera URL firmada (5 min)
    if (data.storage_path) {
      const { data: signed, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(data.storage_path, 300);
      if (!signError && signed?.signedUrl) return signed.signedUrl;
    }

    // Fallback: devuelve la URL directa
    return data.file_url ?? '';
  },

  setCategory: (category) => set({ selectedCategory: category }),
}));
