import type { APIRoute } from 'astro';

import type { QueueStatusType } from '@/db/schema';
import { createApiResponse } from '@/lib/app';
import { ValidationError } from '@/lib/error';
import { QueueService } from '@/services/queue.service';

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = locals.db;
  const env = locals.env;

  const url = new URL(request.url);
  const id = url.searchParams.get('id') || ``;
  const status = url.searchParams.get('status') || ``;

  if (!id) throw new ValidationError('Missing id');

  const queueService = new QueueService(db);

  await queueService.updateStatus(env, id, status as QueueStatusType);

  return createApiResponse();
};
