import type { APIRoute } from 'astro';

import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.db;

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || ``;

  const queueService = new QueueService(db);

  const count = await queueService.getActiveCount({
    env: locals.env,
    type,
  });

  return createApiResponse({ count });
};
