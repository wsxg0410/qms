import type { APIRoute } from 'astro';

import { bulkAddQueueInputSchema } from '@/dto/queue.dto';
import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const body = await request.json();

  const payload = bulkAddQueueInputSchema.parse(body);

  if (!payload?.data?.length) return createApiResponse(0);

  const queueService = new QueueService(db);

  await queueService.bulkAdd(payload.type, payload.data, {
    env,
    unique: payload.unique,
    priority: payload.priority,
  });

  return createApiResponse(payload.data.length);
};
