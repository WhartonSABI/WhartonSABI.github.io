import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../lib/auth';

export const prerender = false;

export const GET: APIRoute = ({ redirect }) => {
  const res = redirect('/members', 302);
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
};
