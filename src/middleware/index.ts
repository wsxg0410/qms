import { defineMiddleware, sequence } from 'astro:middleware';
import { drizzle } from 'drizzle-orm/d1';

import { authMdl } from './auth.mdl';
import { errorMdl } from './error.mdl';

export const env = defineMiddleware(({ locals, request }, next) => {
  const headerEnv = request.headers.get('env') ?? request.headers.get('x-env');

  if (!headerEnv) {
    throw new Error('Missing environment header');
  }

  locals.env = headerEnv;

  return next();
});

export const db = defineMiddleware(({ locals }, next) => {
  locals.db = drizzle(locals.runtime.env.DB);

  return next();
});

export const onRequest = sequence(errorMdl, env, authMdl, db);
