'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PhoneLink } from '@/components/site/StoreFacts';
import { business } from '@/config/business';
import {
  CONTACT_METHODS,
  ENQUIRY_TOPICS,
  ENQUIRY_TOPIC_LABELS,
  MAX_MESSAGE_LENGTH,
} from '@/lib/server/validation';
import { Field, Select, TextArea } from './Field';

/**
 * One enquiry form, used on Contact, Lessons, and Repairs.
 *
 * The topic routes the message to the right person later on, and is preset by
 * the page it appears on (and by ?topic= from a product page), so nobody has to
 * classify their own question. No account required to ask a shop a question.
 */
export function EnquiryForm({
  defaultTopic = 'general',
  showInstrument = false,
  compact = false,
}: {
  defaultTopic?: (typeof ENQUIRY_TOPICS)[number];
  /** Repairs asks what the instrument is. */
  showInstrument?: boolean;
  compact?: boolean;
}) {
  const params = useSearchParams();
  const urlTopic = params.get('topic');
  const topic = ENQUIRY_TOPICS.includes(urlTopic as never)
    ? (urlTopic as (typeof ENQUIRY_TOPICS)[number])
    : defaultTopic;
  const aboutItem = params.get('item');

  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setFormError(null);
    setFields({});

    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setFormError(result.error ?? 'That did not send. Try again.');
        setFields(result.fields ?? {});
        setState('idle');
        return;
      }
      setState('sent');
    } catch {
      setFormError('We could not reach the shop. Check your connection, or just call us.');
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="border-l-2 border-brass-deep bg-parchment px-6 py-8">
        <h3 className="font-display text-2xl">This form is not connected yet.</h3>
        <p className="measure mt-3 text-quiet-light">
          This is a demo build: your message was recorded here but has not gone to
          anyone at the shop.{' '}
          {business.phoneDisplay && business.phone
            ? `If you need an answer, please call us at ${business.phoneDisplay}.`
            : 'Please call the shop directly for now.'}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'max-w-2xl'}>
      {/*
        Shown before a single field is filled in, not just after submitting —
        someone should not type out a message and only then learn it goes
        nowhere. See PENDING.md: enquiries are logged, not delivered, until a
        mail provider is connected.
      */}
      <div className="mb-7 border-l-2 border-brass-deep bg-parchment px-5 py-4">
        <p className="font-medium">This form does not reach the shop yet.</p>
        <p className="mt-1.5 text-[0.9375rem] text-quiet-light">
          This is a demo build: a message sent here is recorded but not delivered
          to anyone. For a real answer,{' '}
          {business.phone && business.phoneDisplay ? (
            <>
              call <PhoneLink className="font-medium text-ink" />
            </>
          ) : (
            'please call the shop directly'
          )}
          .
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
      {formError && (
        <div role="alert" className="mb-7 border-l-2 border-danger bg-parchment px-5 py-4">
          <p className="font-medium">{formError}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Select
          name="topic"
          label="What is this about?"
          required
          defaultValue={topic}
          className="sm:col-span-2"
          options={ENQUIRY_TOPICS.map((value) => ({
            value,
            label: ENQUIRY_TOPIC_LABELS[value],
          }))}
          error={fields.topic}
        />

        <Field name="name" label="Your name" autoComplete="name" required error={fields.name} />
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={fields.email}
        />
        <Field
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={fields.phone}
        />

        <Select
          name="preferredContact"
          label="How should we reply?"
          required
          defaultValue="email"
          options={CONTACT_METHODS.map((value) => ({
            value,
            label: value === 'phone' ? 'Give me a call' : 'Send me an email',
          }))}
          error={fields.preferredContact}
        />

        {showInstrument && (
          <Field
            name="instrument"
            label="Instrument or equipment"
            hint="Make and model if you know it. A rough description is fine."
            className="sm:col-span-2"
            error={fields.instrument}
          />
        )}

        <TextArea
          name="message"
          label={showInstrument ? 'What is wrong with it?' : 'What do you need?'}
          required
          rows={6}
          maxLength={MAX_MESSAGE_LENGTH}
          defaultValue={aboutItem ? `I am interested in the ${aboutItem.replace(/-/g, ' ')}.` : undefined}
          className="sm:col-span-2"
          error={fields.message}
        />
      </div>

      {/* Honeypot: positioned off screen and hidden from assistive tech, so
          only a script ever fills it in. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="website-field">Leave this empty</label>
        <input id="website-field" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-8 min-h-13 rounded-[var(--radius-xs)] bg-ink px-8 py-4 font-medium text-paper transition-colors hover:bg-walnut disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send it'}
      </button>
      </form>
    </div>
  );
}
