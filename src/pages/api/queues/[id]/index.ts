import type { APIRoute } from 'astro';

import { QueueStatus, type QueueStatusType } from '@/db/schema';
import { createApiResponse } from '@/lib/app';
import { NotFoundError, ValidationError } from '@/lib/error';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ locals, params }) => {
  const db = locals.db;
  const id = params.id;

  if (!id) return createApiResponse({ message: 'Missing id' }, 400);

  const queueService = new QueueService(db);
  const queue = await queueService.getById(id);

  if (!queue || queue.env !== locals.env) {
    throw new NotFoundError('Queue not found');
  }

  return createApiResponse(queue);
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  const db = locals.db;

  const id = params.id;

  if (!id) {
    return createApiResponse(
      {
        success: false,
        error: 'Missing id',
      },
      400,
    );
  }

  const queueService = new QueueService(db);

  await queueService.remove(locals.env, id);

  return createApiResponse();
};

export const PUT: APIRoute = async ({ request, locals, params }) => {
  const db = locals.db;
  const env = locals.env;

  const id = params.id;

  if (!id) throw new ValidationError('Missing id');

  const body = await request.json<{
    status: QueueStatusType;
    errorTimes: number;
    result: string;
  }>();

  const status = body.status;

  if (!QueueStatus.includes(status))
    throw new ValidationError('Invalid status');

  const queueService = new QueueService(db);

  const bd = await queueService.updateQueue(env, id, {
    status,
    errorTimes: body.errorTimes,
    result: body.result,
  });

  return createApiResponse(bd);
};
