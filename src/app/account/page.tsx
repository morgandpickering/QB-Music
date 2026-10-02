import type { Metadata } from 'next';
import Link from 'next/link';
import { PhoneLink } from '@/components/site/StoreFacts';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealLines } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Account',
  description:
    'Customer accounts at Quattlebaum Music are not open yet. Your cart and wishlist are kept in this browser in the meantime.',
  alternates: { canonical: '/account' },
  robots: { index: false, follow: true },
};

/**
 * There is no sign-in, and this page says so plainly.
 *
 * The header carries an Account control because shoppers look for one, and an
 * honest page explaining what does and does not exist is better than either a
 * dead link or a sign-in form that cannot sign anybody in. When accounts are
 * built, this page becomes the dashboard and nothing else has to move.
 */
export default function AccountPage() {
  return (
    <>
      <header className="bg-ink pb-12 pt-16 text-paper md:pt-24">
        <div className="shell">
          <RevealLines
            as="h1"
            lines={['No sign-in yet —', 'and nothing to sign into.']}
            immediate
            delay={80}
            className="max-w-[20ch] text-4xl md:text-5xl"
          />
          <Reveal variant="rise" delay={300} immediate className="mt-7">
            <p className="measure text-lg text-quiet-dark">
              We have not opened customer accounts. Rather than show you a login box
              that does nothing, here is exactly how the site works without one.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-16 text-ink on-light md:py-20">
        <div className="shell grid gap-10 lg:grid-cols-3">
          <section className="border border-rule-light p-7">
            <h2 className="font-display text-2xl">Your cart</h2>
            <p className="mt-3 leading-relaxed text-quiet-light">
              Kept in this browser. It survives closing the tab, and it is not shared
              with any other device. Checkout asks for a name and an email when you
              get there — no account needed.
            </p>
            <Link href="/cart" className="link-draw mt-5 inline-block font-medium">
              View your cart
            </Link>
          </section>

          <section className="border border-rule-light p-7">
            <h2 className="font-display text-2xl">Your wishlist</h2>
            <p className="mt-3 leading-relaxed text-quiet-light">
              Also kept in this browser. Save anything with the heart on a product,
              then bring the list in on your phone and we will get those things down
              off the wall for you.
            </p>
            <Link href="/wishlist" className="link-draw mt-5 inline-block font-medium">
              View your wishlist
            </Link>
          </section>

          <section className="border border-rule-light p-7">
            <h2 className="font-display text-2xl">Your order</h2>
            <p className="mt-3 leading-relaxed text-quiet-light">
              Order confirmations go to the email address you give at checkout, and
              that email is the record. If you need to change or chase an order, call
              the shop — you will get somebody who can actually go and look at it.
            </p>
            <div className="mt-5">
              <PhoneLink className="font-medium" />
            </div>
          </section>
        </div>

        <div className="shell mt-14 border-t border-rule-light pt-10">
          <h2 className="font-display text-2xl">When accounts arrive</h2>
          <p className="measure mt-3 leading-relaxed text-quiet-light">
            Order history, saved addresses, and a wishlist that follows you between
            devices. We would rather build that properly than ask you to make a
            password for a shop you can phone.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Button href="/shop" variant="solid">
              Shop instruments
            </Button>
            <Button href="/contact" variant="outline">
              Contact the store
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
