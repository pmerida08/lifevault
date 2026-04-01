import { z } from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().optional(),
  all_day: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4d44e3'),
  reminder_minutes: z.number().int().min(0).optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const EventQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(50),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type EventQuery = z.infer<typeof EventQuerySchema>;
