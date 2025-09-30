import type { APIRoute } from 'astro';

import type { QueueStatusType } from '@/db/schema';
import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.db;

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || undefined;
  const status = url.searchParams.get('status');

  const queueService = new QueueService(db);

  await queueService.reactive(locals.env, {
    type,
    status: status as QueueStatusType,
  });

  return createApiResponse();
};
