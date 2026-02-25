import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createHmac, timingSafeEqual } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '../..');
const envFiles = [
  path.join(websiteRoot, '.env'),
  path.join(websiteRoot, '.env.local'),
  path.join(websiteRoot, '.env.development'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'website', '.env'),
];
envFiles.forEach((p) => dotenv.config({ path: p }));
import { getMemberGithubUsernames } from './data';

const SESSION_COOKIE = 'wsabi_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  login: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters');
  }
  return secret;
}

function sign(payload: string): string {
  const secret = getSecret();
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verify(token: string): Session | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = sign(payload);
    const a = Buffer.from(token, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
    if (data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): Session | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  return verify(decodeURIComponent(match[1]));
}

export function createSessionCookie(login: string): string {
  const payload = Buffer.from(
    JSON.stringify({ login: login.toLowerCase(), exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })
  ).toString('base64url');
  const token = sign(payload);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isMember(githubLogin: string): boolean {
  return getMemberGithubUsernames().has(githubLogin.toLowerCase());
}

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

export function getGitHubAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID must be set. Create a .env file in the website folder (see .env.example).');
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
  });
  return `${GITHUB_AUTH_URL}?${params}`;
}

export async function exchangeCodeForUser(code: string, redirectUri: string): Promise<{ login: string } | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set');

  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) return null;

  const userRes = await fetch(GITHUB_USER_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = (await userRes.json()) as { login?: string };
  return user.login ? { login: user.login } : null;
}
