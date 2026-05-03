import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * 验证 admin auth key 是否有效
 * POST /api/admin/verify — body: { authKey: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const authKey = body?.authKey;
    const validKey = (env as any).ADMIN_AUTH_KEY;

    if (!validKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'ADMIN_AUTH_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!authKey || authKey !== validKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid auth key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Bad request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
