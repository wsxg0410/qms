import type { APIRoute } from 'astro';

import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const DELETE: APIRoute = async ({ request, locals }) => {
  const db = locals.db;

  const url = new URL(request.url);
  const id = url.searchParams.get('id') || ``;

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
