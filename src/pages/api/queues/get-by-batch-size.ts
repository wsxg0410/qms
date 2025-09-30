import type { APIRoute } from 'astro';

import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.db;

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || ``;
  const batchSize = url.searchParams.get('batchSize') || `10`;

  const queueService = new QueueService(db);

  const queues = await queueService.getByBatchSize({
    env: locals.env,
    type,
    batchSize: Number(batchSize),
  });

  return createApiResponse(queues);
};
