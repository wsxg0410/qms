import { ActionError } from 'astro:actions';
import { env } from 'cloudflare:workers';

/**
 * 校验 admin 请求的 auth key
 * 从请求 header 中读取 x-auth-key 并与 Cloudflare secrets 比对
 * dev 模式下从 .dev.vars 读取，production 从 Cloudflare Secrets 读取
 */
export function verifyAuthKey(request: Request): void {
  const authKey = request.headers.get('x-auth-key');
  const validKey = (env as any).ADMIN_AUTH_KEY;

  if (!validKey) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'ADMIN_AUTH_KEY is not configured',
    });
  }

  if (!authKey || authKey !== validKey) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing auth key',
    });
  }
}
