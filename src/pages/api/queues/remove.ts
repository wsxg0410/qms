import type { APIRoute } from 'astro';

import { removeQueueInputSchema } from '@/dto/queue.dto';
import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const body = await request.json();
  const payload = removeQueueInputSchema.parse(body);

  // 至少需要一个过滤条件，防止误删全部
  if (!payload.type && !payload.status) {
    return createApiResponse(
      { message: 'At least one filter (type or status) is required' },
      400,
    );
  }

  const queueService = new QueueService(db);

  await queueService.removeAll(env, payload);

  return createApiResponse(true);
};
