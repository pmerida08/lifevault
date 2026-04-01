// ─── Shared types across backend and mobile ───────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  category: 'legal' | 'health' | 'finance' | 'personal' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VaultNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  all_day: boolean;
  color?: string;
  reminder_minutes?: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────

export interface AIQueryRequest {
  message: string;
  context?: {
    document_ids?: string[];
    include_tasks?: boolean;
    include_events?: boolean;
  };
}

export interface AIAction {
  type: 'create_task' | 'create_event' | 'open_document' | 'navigate';
  payload: Record<string, unknown>;
  label: string;
}

export interface AIQueryResponse {
  message: string;
  actions: AIAction[];
  attachments: Array<{
    type: 'document' | 'task' | 'event';
    id: string;
    title: string;
  }>;
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
