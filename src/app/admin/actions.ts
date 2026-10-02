'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { parseDollars } from '@/lib/offers/rules';
import { identityKey, rateLimit } from '@/lib/server/rate-limit';
import {
  PKCE_COOKIE,
  STAFF_COOKIE,
  authCallbackUrl,
  cookieOptions,
  getStaffSession,
  isStaffEmail,
} from '@/lib/server/staff';
import { pkcePair, rpc, sendMagicLink } from '@/lib/server/supabase';

/**
 * Staff actions. Server actions are public endpoints, so every one of them
 * re-checks the session itself — being reachable from /admin proves nothing.
 */

export async function requestStaffLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  // Keyed on the address asked for, not a forwarding header the caller picks:
  // the staff inbox gets at most 5 links per 15 minutes whoever is asking.
  // Every address is limited alike, so 'slow' does not reveal who is staff.
  if (!rateLimit(identityKey('staff-link', email), 5, 15 * 60_000).ok) redirect('/admin/login?error=slow');

  // Same answer for every address, so the form does not reveal who is staff.
  if (isStaffEmail(email)) {
    const { verifier, challenge } = pkcePair();
    const sent = await sendMagicLink(email, await authCallbackUrl(), challenge);
    if (sent.ok) {
      (await cookies()).set(PKCE_COOKIE, verifier, { ...cookieOptions, maxAge: 3600 });
    } else {
      console.error('[admin] magic link failed', { status: sent.error.status, code: sent.error.code });
    }
  }
  redirect('/admin/login?sent=1');
}

export async function signOut() {
  (await cookies()).delete({ name: STAFF_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

const ACTIONS = ['accept', 'counter', 'decline'] as const;
type Action = (typeof ACTIONS)[number];

/** Database error code -> message key on /admin/offers (see OFFER_MESSAGES). */
const DB_ERRORS: Record<string, string> = {
  '22023': 'counter-range',
  P0001: 'closed',
  '42501': 'forbidden',
};

export async function respondToOffer(formData: FormData) {
  const staff = await getStaffSession();
  if (!staff) redirect('/admin/login');

  const offerId = String(formData.get('offerId') ?? '');
  const action = String(formData.get('action') ?? '') as Action;
  const note = String(formData.get('note') ?? '').trim().slice(0, 1000);
  const back = (msg: string): never =>
    redirect(`/admin/offers?msg=${encodeURIComponent(msg)}#offer-${encodeURIComponent(offerId)}`);

  if (!/^[0-9a-f-]{36}$/i.test(offerId) || !ACTIONS.includes(action)) {
    back('bad');
  }

  let counter: number | null = null;
  if (action === 'counter') {
    counter = parseDollars(String(formData.get('counter') ?? ''));
    if (counter === null) back('counter-format');
  }

  // Runs as the staff member's own token: the database re-checks staff status.
  const result = await rpc<string>(
    'staff_respond_to_offer',
    { p_offer_id: offerId, p_action: action, p_counter_amount_cents: counter, p_note: note || null },
    { accessToken: staff.accessToken },
  );
  revalidatePath('/admin/offers');

  if (!result.ok) back(DB_ERRORS[result.error.code ?? ''] ?? 'failed');
  if (result.ok && result.data === 'expired') {
    back('expired');
  }
  back({ accept: 'accepted', counter: 'countered', decline: 'declined' }[action]);
}
