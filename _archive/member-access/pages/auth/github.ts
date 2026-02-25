import type { APIRoute } from 'astro';
import { getGitHubAuthUrl } from '../../lib/auth';
import { randomBytes } from 'crypto';

export const prerender = false;

export const GET: APIRoute = ({ redirect, url }) => {
  const redirectTo = url.searchParams.get('redirect') || '/members';
  const redirectUri = `${url.origin}/auth/callback`;
  const state = Buffer.from(JSON.stringify({ r: redirectTo, n: randomBytes(8).toString('hex') })).toString('base64url');
  const authUrl = getGitHubAuthUrl(redirectUri, state);
  return redirect(authUrl, 302);
};
