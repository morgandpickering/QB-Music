import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

/**
 * Supabase over plain fetch: PostgREST for data, GoTrue for the staff sign-in.
 *
 * ponytail: no supabase-js. The site makes three kinds of call (an RPC, a
 * select, a magic link) and fetch covers all three; switch to @supabase/ssr
 * if customer accounts arrive and sessions need refreshing in middleware.
 *
 * SUPABASE_SECRET_KEY is read here and nowhere else. `server-only` makes any
 * client import of this file a build error. Never log a key or a token.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

// The secret key must not travel over TLS that is not verified. The machine
// this was built on sets NODE_TLS_REJECT_UNAUTHORIZED=0 for the user; a
// production server running like that refuses to call Supabase at all.
const TLS_UNVERIFIED = process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';

export function supabaseConfigured(): boolean {
  if (TLS_UNVERIFIED && process.env.NODE_ENV === 'production') return false;
  return Boolean(URL && PUBLISHABLE && SECRET);
}

/** `service` = the secret key (bypasses RLS); a string = a staff access token (RLS applies). */
export type SupabaseAuth = 'service' | { accessToken: string };

function headersFor(auth: SupabaseAuth): Record<string, string> {
  if (auth === 'service') {
    // sb_secret_ keys go in `apikey` only; the gateway mints the service JWT.
    return SECRET!.startsWith('sb_')
      ? { apikey: SECRET! }
      : { apikey: SECRET!, Authorization: `Bearer ${SECRET}` };
  }
  return { apikey: PUBLISHABLE!, Authorization: `Bearer ${auth.accessToken}` };
}

export interface DbError {
  status: number;
  code: string | null;
  hint: string | null;
}

export type DbResult<T> = { ok: true; data: T } | { ok: false; error: DbError };

async function call<T>(path: string, init: RequestInit, auth: SupabaseAuth): Promise<DbResult<T>> {
  if (!supabaseConfigured()) return { ok: false, error: { status: 503, code: 'not_configured', hint: null } };
  let response: Response;
  try {
    response = await fetch(`${URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...headersFor(auth), ...init.headers },
    });
  } catch {
    return { ok: false, error: { status: 503, code: 'network', hint: null } };
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      error: { status: response.status, code: body?.code ?? null, hint: body?.hint ?? null },
    };
  }
  return { ok: true, data: body as T };
}

export function rpc<T>(fn: string, args: Record<string, unknown>, auth: SupabaseAuth) {
  return call<T>(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }, auth);
}

export function select<T>(tableAndQuery: string, auth: SupabaseAuth) {
  return call<T>(`/rest/v1/${tableAndQuery}`, { method: 'GET' }, auth);
}

/* ---- Staff auth (GoTrue, PKCE magic link) ------------------------------ */

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export async function sendMagicLink(email: string, redirectTo: string, challenge: string) {
  return call<unknown>(
    `/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        create_user: true,
        code_challenge: challenge,
        code_challenge_method: 's256',
      }),
    },
    { accessToken: PUBLISHABLE ?? '' },
  );
}

export interface AuthSession {
  access_token: string;
  expires_in: number;
}

export function exchangeCode(code: string, verifier: string) {
  return call<AuthSession>(
    '/auth/v1/token?grant_type=pkce',
    { method: 'POST', body: JSON.stringify({ auth_code: code, code_verifier: verifier }) },
    { accessToken: PUBLISHABLE ?? '' },
  );
}

export async function getAuthUser(accessToken: string) {
  return call<{ email?: string; email_confirmed_at?: string | null }>(
    '/auth/v1/user',
    { method: 'GET' },
    { accessToken },
  );
}
