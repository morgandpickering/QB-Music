import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/server/staff';
import { requestStaffLink } from '../actions';

export const metadata: Metadata = {
  title: 'Staff sign-in',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  link: 'That sign-in link did not work. Links work once, in the browser that asked for them, for an hour. Ask for a new one.',
  slow: 'Too many requests. Wait a few minutes and try again.',
};

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  if (await getStaffSession()) redirect('/admin/offers');
  const { sent, error } = await searchParams;

  return (
    <div className="on-light bg-paper py-16 text-ink md:py-24">
      <div className="shell">
        <div className="max-w-xl">
        <h1 className="text-3xl md:text-4xl">Staff sign-in</h1>
        <p className="measure mt-4 text-quiet-light">
          For shop staff reviewing offers. Enter your staff email and we will send a one-time
          sign-in link.
        </p>

        {sent && (
          <div role="status" className="mt-7 border-l-2 border-brass-deep bg-parchment px-5 py-4">
            <p className="font-medium">If that address is on the staff list, a link is on its way.</p>
            <p className="mt-1.5 text-[0.9375rem] text-quiet-light">
              Open it in this browser. It works once and expires in an hour.
            </p>
          </div>
        )}
        {error && ERRORS[error] && (
          <div role="alert" className="mt-7 border-l-2 border-danger bg-parchment px-5 py-4">
            <p className="font-medium">{ERRORS[error]}</p>
          </div>
        )}

        <form action={requestStaffLink} className="mt-8">
          <label htmlFor="staff-email" className="block text-[0.9375rem] font-medium">
            Staff email
          </label>
          <input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 h-13 w-full border border-rule-light bg-transparent px-4 py-3 text-base transition-colors focus:border-ink"
          />
          <button
            type="submit"
            className="mt-6 min-h-13 rounded-[var(--radius-xs)] bg-ink px-8 py-4 font-medium text-paper transition-colors hover:bg-walnut"
          >
            Send sign-in link
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
