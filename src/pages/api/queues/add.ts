import type { APIRoute } from 'astro';

import { addQueueInputSchema } from '@/dto/queue.dto';
import { createApiResponse } from '@/lib/app';
import { ValidationError } from '@/lib/error';
import { QueueService } from '@/services/queue.service';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const body = await request.json();

  const payload = addQueueInputSchema.parse(body);

  if (!payload?.type) throw new ValidationError('Missing type');

  const { type, data, unique = true, priority = 0 } = payload;

  const queueService = new QueueService(db);

  const created = await queueService.add(type, data, {
    env,
    unique,
    priority,
  });

  return createApiResponse(created);
};
