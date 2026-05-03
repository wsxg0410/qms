import { defineMiddleware, sequence } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';

import { errorMdl } from './error.mdl';

/**
 * 只有 /api/* 路由需要 env header
 * 其他路径（admin SPA、actions、首页）跳过
 */
const isApiRoute = (pathname: string) =>
  pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/');

export const envMdl = defineMiddleware(({ locals, request }, next) => {
  const url = new URL(request.url);

  if (!isApiRoute(url.pathname)) {
    return next();
  }

  const headerEnv = request.headers.get('env') ?? request.headers.get('x-env');

  if (!headerEnv) {
    throw new Error('Missing environment header');
  }

  locals.env = headerEnv;

  return next();
});

export const db = defineMiddleware(({ locals }, next) => {
  locals.db = drizzle(env.DB);

  return next();
});

export const onRequest = sequence(errorMdl, envMdl, db);
