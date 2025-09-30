import z from 'zod';

import { QueueStatus } from '@/db/schema';

export const addQueueInputSchema = z.object({
  type: z.string(),
  data: z.any(),
  unique: z.boolean().optional(),
  priority: z.number().optional(),
});

export type AddQueueInput = z.infer<typeof addQueueInputSchema>;

export const bulkAddQueueInputSchema = z.object({
  type: z.string(),
  data: z.array(z.any()),
  unique: z.boolean().optional(),
  priority: z.number().optional(),
});

export type BulkAddQueueInput = z.infer<typeof bulkAddQueueInputSchema>;

export const getQueueInputSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
  type: z.string().optional(),
  status: z.enum(QueueStatus).optional(),
});

export type GetQueueInput = z.infer<typeof getQueueInputSchema>;
