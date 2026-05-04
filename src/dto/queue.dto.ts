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

export const listQueueInputSchema = z.object({
  type: z.string().optional(),
  status: z.enum(QueueStatus).optional(),
  resultKeyword: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListQueueInput = z.infer<typeof listQueueInputSchema>;

export const batchStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(QueueStatus),
});

export type BatchStatusInput = z.infer<typeof batchStatusInputSchema>;

export const removeQueueInputSchema = z.object({
  type: z.string().optional(),
  status: z.enum(QueueStatus).optional(),
});

export type RemoveQueueInput = z.infer<typeof removeQueueInputSchema>;

