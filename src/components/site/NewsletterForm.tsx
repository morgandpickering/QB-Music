'use client';

import { useId, useState } from 'react';
import { PhoneLink } from '@/components/site/StoreFacts';
import { business } from '@/config/business';

/**
 * Newsletter sign-up.
 *
 * One field, a real label, and an honest result message. The status line is
 * `aria-live`, so somebody who cannot see the form change still hears what
 * happened; errors name the field in words rather than turning the border red
 * and hoping.
 *
 * `website` is a honeypot — positioned off-screen and never announced, so a
 * person never meets it and a script fills it in.
 */
export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: trap }),
      });
      const data = (await response.json()) as {
        error?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok) {
        setState('error');
        setMessage(data.fields?.email ?? data.error ?? 'That did not go through.');
        return;
      }

      setState('done');
      setMessage(
        business.phoneDisplay && business.phone
          ? `This is a demo build: sign-ups are recorded here but not yet added to a mailing list. Call ${business.phoneDisplay} if you want to be notified directly.`
          : 'This is a demo build: sign-ups are recorded here but not yet added to a mailing list.',
      );
      setEmail('');
    } catch {
      setState('error');
      setMessage('That did not go through. Check your connection, or call the shop.');
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor={id} className="block text-sm font-semibold text-brass-light">
        New arrivals, in your inbox
      </label>
      {/*
        Shown before the email field, not just after submitting — this is a
        demo build and the form does not add anyone to a real list yet. See
        PENDING.md.
      */}
      <p className="measure-narrow mt-2 text-sm text-quiet-dark">
        This demo form only records a sign-up; it does not add you to a real list
        yet.{' '}
        {business.phone && business.phoneDisplay ? (
          <>
            Call <PhoneLink className="text-paper" /> if you want to be notified
            directly.
          </>
        ) : (
          'Call the shop if you want to be notified directly.'
        )}
      </p>

      <div className="mt-4 flex max-w-sm">
        <input
          id={id}
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={message ? `${id}-status` : undefined}
          aria-invalid={state === 'error' || undefined}
          placeholder="you@example.com"
          className="h-12 min-w-0 flex-1 border border-rule-dark bg-transparent px-4 text-[0.9375rem] text-paper placeholder:text-quiet-dark/70 focus:border-brass-light"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="h-12 shrink-0 bg-amber px-5 font-medium text-ink transition-colors hover:bg-brass-light disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : 'Sign up'}
        </button>
      </div>

      {/* Honeypot. Off-screen rather than display:none, which some bots skip. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input
          id={`${id}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
        />
      </div>

      <p
        id={`${id}-status`}
        aria-live="polite"
        className={`mt-3 text-sm ${state === 'error' ? 'text-amber' : 'text-quiet-dark'}`}
      >
        {state === 'error' && message ? <span className="font-medium">Error: </span> : null}
        {message}
      </p>
    </form>
  );
}
