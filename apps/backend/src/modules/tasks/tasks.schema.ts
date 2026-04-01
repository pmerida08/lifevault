import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(50),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQuery = z.infer<typeof TaskQuerySchema>;
