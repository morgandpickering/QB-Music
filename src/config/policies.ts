/**
 * Customer-service policies.
 *
 * NOTHING HERE IS LEGAL TEXT, AND NONE OF IT IS INVENTED.
 *
 * Shipping terms, a returns window, a privacy notice and terms of service are
 * commitments a business makes and a lawyer should check — writing a plausible
 * version and publishing it under the shop's name would create obligations
 * nobody at Quattlebaum agreed to, and a privacy notice that misdescribes what
 * the site actually does is a legal problem rather than a placeholder.
 *
 * So each page below renders a clearly-labelled notice, says what it will say
 * once the shop supplies it, and gives the reader a way to get a real answer
 * today — the telephone. Fill `body` in, set `status: 'published'`, and the
 * notice is replaced by the real thing.
 *
 * `body` accepts paragraphs of plain text. If a policy needs headings and
 * lists, give it its own route rather than growing a Markdown renderer for
 * five pages.
 */

export type PolicyStatus = 'pending' | 'published';

export interface Policy {
  slug: string;
  title: string;
  /** Used in <title> and the meta description. */
  summary: string;
  status: PolicyStatus;
  /** What this page will cover. Shown while the policy is pending. */
  covers: string[];
  /** The real text, once it exists. Paragraphs. */
  body?: string[];
}

export const policies: Policy[] = [
  {
    slug: 'shipping',
    title: 'Shipping',
    summary: 'How orders from Quattlebaum Music are shipped or collected.',
    status: 'pending',
    covers: [
      'Which carriers we use, and what shipping costs',
      'How long an order takes to leave the shop',
      'Which large or fragile items are collection only',
      'How free local pickup in Searcy works, and when an order is ready',
      'Where we can and cannot ship',
    ],
  },
  {
    slug: 'returns',
    title: 'Returns',
    summary: 'Returns, exchanges and warranty support at Quattlebaum Music.',
    status: 'pending',
    covers: [
      'How long you have to return something, and in what condition',
      'What happens with an instrument that has been set up for you',
      'Restocking, if any, and who pays return shipping',
      'How manufacturer warranty claims are handled',
      'What is non-returnable — strings, reeds, and anything used on the body',
    ],
  },
  {
    slug: 'store',
    title: 'Store Policies',
    summary: 'Layaway, holds, trade-ins, special orders and repair terms.',
    status: 'pending',
    covers: [
      'Layaway terms, deposits, and how long we hold an item',
      'How trade-ins are valued and what we take',
      'Deposits on special orders',
      'Repair turnaround, estimates, and unclaimed instruments',
      'School and church account terms',
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What data this site collects, why, and what happens to it.',
    status: 'pending',
    covers: [
      'What an order or enquiry collects, and how long it is kept',
      'That card details are handled by the payment provider and never reach this site',
      'What the browser stores locally — the cart and the wishlist',
      'Which third parties receive anything, and why',
      'How to ask for your data, or ask for it to be deleted',
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'The terms that apply when you buy from Quattlebaum Music online.',
    status: 'pending',
    covers: [
      'When an order becomes a contract, and our right to decline one',
      'Pricing and availability errors',
      'Limits of liability',
      'Governing law and jurisdiction',
      'How these terms may change',
    ],
  },
];

export function getPolicy(slug: string): Policy | null {
  return policies.find((policy) => policy.slug === slug) ?? null;
}
