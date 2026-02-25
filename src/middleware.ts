import { defineMiddleware } from 'astro:middleware';
import { getSessionFromRequest } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (path.startsWith('/members/') && path !== '/members' && !path.startsWith('/members?')) {
    const session = getSessionFromRequest(context.request);
    if (!session) {
      return context.redirect(`/members?redirect=${encodeURIComponent(path)}`, 302);
    }
    context.locals.session = session;
  }
  return next();
});
