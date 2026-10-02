import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PKCE_COOKIE, STAFF_COOKIE, cookieOptions, isStaffEmail } from '@/lib/server/staff';
import { exchangeCode, getAuthUser } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

/** The magic link lands here with ?code=. Trade it for a session, staff only. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const verifier = (await cookies()).get(PKCE_COOKIE)?.value;

  const fail = NextResponse.redirect(new URL('/admin/login?error=link', url));
  fail.cookies.delete({ name: PKCE_COOKIE, path: '/admin' });
  if (!code || !verifier) return fail;

  const session = await exchangeCode(code, verifier);
  if (!session.ok) return fail;

  const user = await getAuthUser(session.data.access_token);
  if (!user.ok || !isStaffEmail(user.data.email)) return fail;

  const done = NextResponse.redirect(new URL('/admin/offers', url));
  done.cookies.delete({ name: PKCE_COOKIE, path: '/admin' });
  done.cookies.set(STAFF_COOKIE, session.data.access_token, {
    ...cookieOptions,
    maxAge: Math.max(60, session.data.expires_in - 60),
  });
  return done;
}
