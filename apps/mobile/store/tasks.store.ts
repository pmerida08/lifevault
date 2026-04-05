import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: (status?: string) => Promise<void>;
  createTask: (input: Partial<Task>) => Promise<void>;
  updateTask: (id: string, input: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async (status) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      set({ tasks: data ?? [] });
    } catch {
      set({ tasks: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    set((state) => ({ tasks: [data, ...state.tasks] }));
  },

  updateTask: async (id, input) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? data : t)),
    }));
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
