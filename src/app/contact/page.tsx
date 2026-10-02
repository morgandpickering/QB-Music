import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { MapPanel } from '@/components/site/MapPanel';
import {
  AddressBlock,
  DirectionsLink,
  EmailLink,
  HoursTable,
  PhoneLink,
  SocialLinks,
} from '@/components/site/StoreFacts';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Contact & Visit',
  description:
    'Quattlebaum Music, 101 W. Arch St., Searcy, Arkansas. Directions, opening hours, and a form for questions about products, lessons, repairs, or sound systems.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Come in"
        lines={['Downtown Searcy,', 'on West Arch.']}
        lede="You are welcome to spend an hour here without buying anything. Plug something in, sit at the kit, ask whatever you want to ask."
        image={images.contactMap}
      />

      {/* ---- Details + map ---------------------------------------------- */}
      <Section ground="paper">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading kicker="The shop" lines={['Where to find us.']} />

            <Reveal variant="rise" delay={140} className="mt-8 space-y-8">
              <AddressBlock className="text-lg" />

              <div>
                <h3 className="font-sans text-sm font-semibold">Get in touch</h3>
                <div className="mt-3 flex flex-col items-start gap-2 text-quiet-light">
                  <PhoneLink className="text-ink" />
                  <EmailLink className="text-ink" />
                  <DirectionsLink className="text-ink" />
                </div>
              </div>

              <div>
                <h3 className="font-sans text-sm font-semibold">Opening hours</h3>
                <HoursTable className="mt-3 text-quiet-light" />
              </div>

              <div>
                <h3 className="font-sans text-sm font-semibold">Parking</h3>
                <p className="measure-narrow mt-3 text-quiet-light">
                  Street parking on Arch. If you are collecting something large, pull up
                  outside and come in — we will help you load it.
                </p>
              </div>

              <SocialLinks className="text-quiet-light" />
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <MapPanel ratio="3 / 2" />
          </div>
        </div>
      </Section>

      {/* ---- Form -------------------------------------------------------- */}
      <Section ground="parchment">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              kicker="Send a message"
              lines={['Ask us', 'anything.']}
              lede="Pick what it is about so it reaches the right person. No account, no sign-up, and we will not put you on a mailing list."
            />

            <Reveal variant="rise" delay={220} className="mt-10">
              <div className="border-l-2 border-brass pl-6">
                <p className="font-medium">Calling is usually faster.</p>
                <p className="measure-narrow mt-2 text-quiet-light">
                  Especially for anything urgent, or if you want to know whether something
                  is in stock right now.
                </p>
                <PhoneLink className="mt-3 inline-block font-medium" />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Suspense fallback={null}>
              <EnquiryForm defaultTopic="general" />
            </Suspense>
          </div>
        </div>
      </Section>
    </>
  );
}
