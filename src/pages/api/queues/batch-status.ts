import type { APIRoute } from 'astro';

import { batchStatusInputSchema } from '@/dto/queue.dto';
import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const body = await request.json();
  const payload = batchStatusInputSchema.parse(body);

  const queueService = new QueueService(db);

  const updatedCount = await queueService.batchUpdateStatus(
    env,
    payload.ids,
    payload.status,
  );

  return createApiResponse({ updatedCount });
};
