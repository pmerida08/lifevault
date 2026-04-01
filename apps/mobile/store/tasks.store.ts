import { create } from 'zustand';
import { api } from '../lib/api';
import type { Task } from '@lifevault/shared';

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
      const query = status ? `?status=${status}` : '';
      const tasks = await api.get<Task[]>(`/tasks${query}`);
      set({ tasks: Array.isArray(tasks) ? tasks : [] });
    } catch {
      set({ tasks: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (input) => {
    const task = await api.post<Task>('/tasks', input);
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },

  updateTask: async (id, input) => {
    const updated = await api.patch<Task>(`/tasks/${id}`, input);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
