import type { APIRoute } from 'astro';

import { QueueStatus, type QueueStatusType } from '@/db/schema';
import { createApiResponse } from '@/lib/app';
import { ValidationError } from '@/lib/error';
import { QueueService } from '@/services/queue.service';

export const PUT: APIRoute = async ({ request, locals, params }) => {
  const db = locals.db;
  const env = locals.env;

  const id = params.id;

  if (!id) throw new ValidationError('Missing id');

  const body = await request.json<{ status: QueueStatusType }>();

  const status = body.status || ``;

  if (!QueueStatus.includes(status))
    throw new ValidationError('Invalid status');

  const queueService = new QueueService(db);

  const d = await queueService.updateStatus(env, id, status as QueueStatusType);

  return createApiResponse(d);
};
