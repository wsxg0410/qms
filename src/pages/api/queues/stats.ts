import type { APIRoute } from 'astro';

import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || undefined;

  const queueService = new QueueService(db);

  const stats = await queueService.getStats(env, type);

  return createApiResponse(stats);
};
