import { z } from 'zod';

export const AssistantQuerySchema = z.object({
  message: z.string().min(1).max(2000),
  session_id: z.string().uuid().optional(),
  context: z.object({
    document_ids: z.array(z.string().uuid()).optional(),
    include_tasks: z.boolean().default(true),
    include_events: z.boolean().default(true),
  }).optional(),
});

export type AssistantQueryInput = z.infer<typeof AssistantQuerySchema>;
