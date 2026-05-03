import { ActionError } from 'astro:actions';

/**
 * 校验 admin 请求的 auth key
 * 从请求 header 中读取 x-auth-key 并与环境变量比对
 * 构建时从 .env / .env.production 读取并内联到 server bundle
 */
export function verifyAuthKey(request: Request): void {
  const authKey = request.headers.get('x-auth-key');
  const validKey = import.meta.env.ADMIN_AUTH_KEY;

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
