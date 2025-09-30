import type { APIRoute } from 'astro';

import { createApiResponse } from '@/lib/app';
import { QueueService } from '@/services/queue.service';

export const GET: APIRoute = async ({ request, locals, params }) => {
  const db = locals.db;

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || ``;
    const batchSize = url.searchParams.get('batchSize') || `10`;

    const queueService = new QueueService(db);

    const queues = await queueService.getByBatchSize({
      env: locals.env,
      type,
      batchSize: Number(batchSize),
    });

    return createApiResponse(
      {
        success: true,
        data: queues,
      },
      200,
    );
  } catch (error) {
    return createApiResponse(
      {
        success: false,
        error: 'Failed to get images',
      },
      500,
    );
  }
};
