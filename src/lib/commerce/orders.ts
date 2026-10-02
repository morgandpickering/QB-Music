import 'server-only';
import { randomUUID } from 'node:crypto';
import type { CustomerDetails, PricedOrder } from '@/lib/payments/provider';

/**
 * ORDER RECORDS
 *
 * Deliberately a thin store with a narrow interface, so the in-memory map
 * below can be replaced by Postgres, Supabase, or the shop's POS without
 * touching the checkout route or the confirmation page.
 *
 * ponytail: in-memory, so orders do not survive a restart or span server
 * instances. That is fine for development and unacceptable the day real money
 * moves — swap `store` for a real database before going live (PENDING.md).
 */

export type OrderStatus = 'awaiting-payment' | 'paid' | 'failed' | 'cancelled';

export interface OrderRecord {
  id: string;
  status: OrderStatus;
  order: PricedOrder;
  customer: CustomerDetails;
  /** Payment provider session id, set once a checkout session exists. */
  sessionId: string | null;
  /** Short code the customer quotes at the counter for a collection. */
  reference: string;
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
}

/**
 * Held on globalThis rather than in a module-level `const`.
 *
 * Next.js does not guarantee that a route handler and a page render share one
 * module instance — in development they are compiled into separate graphs — so
 * a plain module-scoped Map would give /api/checkout and /checkout/simulate two
 * different stores, and every order would look lost the moment it was created.
 * The same trick database clients use for the same reason.
 */
const globalStore = globalThis as typeof globalThis & {
  __qmOrders?: Map<string, OrderRecord>;
};

const store: Map<string, OrderRecord> = (globalStore.__qmOrders ??= new Map());

function makeReference(): string {
  // Unambiguous alphabet: no I, O, 0, or 1 to read out over the phone.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `QM-${out}`;
}

export async function createOrder(
  order: PricedOrder,
  customer: CustomerDetails,
): Promise<OrderRecord> {
  const record: OrderRecord = {
    id: randomUUID(),
    status: 'awaiting-payment',
    order,
    customer,
    sessionId: null,
    reference: makeReference(),
    createdAt: new Date().toISOString(),
    paidAt: null,
    failureReason: null,
  };
  store.set(record.id, record);
  return record;
}

export async function attachSession(orderId: string, sessionId: string): Promise<void> {
  const record = store.get(orderId);
  if (record) record.sessionId = sessionId;
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  return store.get(orderId) ?? null;
}

/**
 * Called only from a verified webhook. Checks the amount the provider says it
 * captured against the amount we asked for, so a tampered or replayed event
 * cannot mark an order paid for the wrong sum.
 */
export async function markPaid(
  orderId: string,
  sessionId: string,
  amountPaid: number,
): Promise<OrderRecord | null> {
  const record = store.get(orderId);
  if (!record) return null;
  if (record.sessionId !== sessionId) return null;
  if (record.status === 'paid') return record; // idempotent: providers retry
  if (amountPaid !== record.order.total) {
    record.status = 'failed';
    record.failureReason = 'Captured amount did not match the order total.';
    return record;
  }
  record.status = 'paid';
  record.paidAt = new Date().toISOString();
  return record;
}

export async function markFailed(
  orderId: string,
  sessionId: string,
  reason: string,
): Promise<OrderRecord | null> {
  const record = store.get(orderId);
  if (!record || record.sessionId !== sessionId) return null;
  if (record.status === 'paid') return record;
  record.status = 'failed';
  record.failureReason = reason;
  return record;
}
