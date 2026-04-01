import { z } from 'zod';

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(['legal', 'health', 'finance', 'personal', 'other']).default('other'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

export const DocumentQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
  search: z.string().optional(),
  category: z.enum(['legal', 'health', 'finance', 'personal', 'other']).optional(),
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;
