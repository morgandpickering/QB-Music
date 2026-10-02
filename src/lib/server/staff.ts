import 'server-only';
import { cookies, headers } from 'next/headers';
import { OFFER_STAFF_EMAIL } from '@/lib/offers/rules';
import { SITE_URL } from '@/lib/site';
import { getAuthUser } from './supabase';

/**
 * Staff session for /admin.
 *
 * The cookie holds the Supabase access token, httpOnly and scoped to /admin.
 * Every request re-verifies it with Supabase and re-checks the address, and
 * the database checks the address again (is_offer_staff) on every read and
 * decision — so a stolen page render or a forged cookie gets nothing.
 *
 * ponytail: no refresh token. The session ends when the access token does
 * (an hour by default) and staff request a new link. Add refresh when that
 * gets annoying.
 */

export const STAFF_COOKIE = 'qm_staff';
export const PKCE_COOKIE = 'qm_staff_pkce';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/admin',
};

export interface StaffSession {
  email: string;
  accessToken: string;
}

export function isStaffEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === OFFER_STAFF_EMAIL;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return null;
  const user = await getAuthUser(token);
  if (!user.ok || !user.data.email_confirmed_at || !isStaffEmail(user.data.email)) return null;
  return { email: user.data.email!.toLowerCase(), accessToken: token };
}

/** Where the magic link lands. The request host in development (port 3100
 *  or whatever is running); the configured site origin in production. */
export async function authCallbackUrl(): Promise<string> {
  if (process.env.NODE_ENV === 'production') return `${SITE_URL}/admin/auth/callback`;
  const host = (await headers()).get('host') ?? 'localhost:3100';
  return `http://${host}/admin/auth/callback`;
}
