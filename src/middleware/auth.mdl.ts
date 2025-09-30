import { defineMiddleware } from 'astro:middleware';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET);

export const authMdl = defineMiddleware(async (context, next) => {
  const sessionCookie = context.cookies.get('auth_session');

  let user: any = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie.value, secret);

      user = { username: payload.username as string };
    } catch (error) {
      context.cookies.delete('auth_session', { path: '/' });
      return context.redirect('/login');
    }
  }

  context.locals.user = user;

  return next();
});
