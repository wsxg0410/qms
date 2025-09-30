import type { APIRoute } from 'astro';

import { createApiResponse } from '@/lib/app';

export const GET: APIRoute = async ({ request, locals }) => {
  return createApiResponse(
    {
      success: true,
      data: 'hello',
    },
    200,
  );
};
