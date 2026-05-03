import type { APIRoute } from 'astro';

import type { QueueStatusType } from '@/db/schema';
import { listQueueInputSchema } from '@/dto/queue.dto';
import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const url = new URL(request.url);
  const input = listQueueInputSchema.parse({
    type: url.searchParams.get('type') || undefined,
    status: (url.searchParams.get('status') as QueueStatusType) || undefined,
    page: url.searchParams.get('page') || 1,
    pageSize: url.searchParams.get('pageSize') || 20,
  });

  const queueService = new QueueService(db);

  const result = await queueService.list({ ...input, env });

  return createApiResponse(result);
};
