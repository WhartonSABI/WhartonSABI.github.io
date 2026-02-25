import type { APIRoute } from 'astro';
import {
  exchangeCodeForUser,
  isMember,
  createSessionCookie,
  clearSessionCookie,
} from '../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  let redirectTo = '/members';
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString()) as { r?: string };
      if (decoded.r) redirectTo = decoded.r;
    }
  } catch {
    /* ignore */
  }

  if (!code) {
    const res = redirect(`/members?error=missing_code`, 302);
    res.headers.set('Set-Cookie', clearSessionCookie());
    return res;
  }

  const redirectUri = `${url.origin}/auth/callback`;
  const user = await exchangeCodeForUser(code, redirectUri);
  if (!user) {
    const res = redirect(`/members?error=auth_failed`, 302);
    res.headers.set('Set-Cookie', clearSessionCookie());
    return res;
  }

  if (!isMember(user.login)) {
    const res = redirect(`/members?error=not_member`, 302);
    res.headers.set('Set-Cookie', clearSessionCookie());
    return res;
  }

  const res = redirect(redirectTo, 302);
  res.headers.append('Set-Cookie', createSessionCookie(user.login));
  return res;
};
