'use client';

import { useId } from 'react';

/**
 * A form field.
 *
 * Labels are always visible and always tied to the input — placeholders are not
 * labels. Hints and errors are wired through aria-describedby, errors sit next
 * to the field they belong to rather than in a pile at the top, and an error is
 * announced as well as coloured.
 */

interface BaseProps {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}

export function Field({
  name,
  label,
  hint,
  error,
  required,
  defaultValue,
  className = '',
  type = 'text',
  autoComplete,
  inputMode,
}: BaseProps & {
  type?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal';
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        className={`mt-2 h-13 w-full border bg-transparent px-4 py-3 text-base transition-colors focus:border-ink ${
          error ? 'border-danger' : 'border-rule-light'
        }`}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function TextArea({
  name,
  label,
  hint,
  error,
  required,
  defaultValue,
  className = '',
  rows = 5,
  maxLength,
}: BaseProps & { rows?: number; maxLength?: number }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        className={`mt-2 w-full resize-y border bg-transparent px-4 py-3 text-base transition-colors focus:border-ink ${
          error ? 'border-danger' : 'border-rule-light'
        }`}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function Select({
  name,
  label,
  hint,
  error,
  required,
  defaultValue,
  className = '',
  options,
}: BaseProps & { options: { value: string; label: string }[] }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        className={`mt-2 h-13 w-full border bg-transparent px-4 text-base transition-colors focus:border-ink ${
          error ? 'border-danger' : 'border-rule-light'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-[0.9375rem] font-medium">
      {children}
      {!required && <span className="ml-2 font-normal text-quiet-light">optional</span>}
    </label>
  );
}

function Messages({
  hint,
  hintId,
  error,
  errorId,
}: {
  hint?: string;
  hintId: string;
  error?: string;
  errorId: string;
}) {
  return (
    <>
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-quiet-light">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {/* The word "Error" carries the meaning; the colour only reinforces it. */}
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </>
  );
}
