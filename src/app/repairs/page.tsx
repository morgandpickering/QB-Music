import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Photo } from '@/components/media/Photo';
import { CTASection } from '@/components/site/CTASection';
import { PageHero } from '@/components/ui/PageHero';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealStagger } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { repairServices } from '@/config/services';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Repairs & Services',
  description:
    'Instrument repair at Quattlebaum Music in Searcy — guitar setups, fretwork, electronics, band instrument service, and amplifier repair, done on our own bench.',
  alternates: { canonical: '/repairs' },
};

/**
 * The workshop page. Kept dark end to end — this is the back room, and it
 * should feel like it, in contrast to the lit shop floor of the store pages.
 */
export default function RepairsPage() {
  return (
    <>
      <PageHero
        kicker="Repairs & service"
        lines={['Keep it', 'playing.']}
        lede="Setups, fretwork, electronics, brass and woodwind, amps. Work done here, on our bench, by people who will tell you when something is not worth fixing."
        image={images.repairsHero}
        actions={
          <>
            <Button href="#book" ground="dark" variant="solid" size="lg">
              Book a repair
            </Button>
            <Button href="/contact" ground="dark" variant="outline" size="lg">
              Ask a question
            </Button>
          </>
        }
      />

      {/* ---- The bench ------------------------------------------------ */}
      <Section ground="ink">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHeading
              kicker="On the bench"
              lines={['The thing in', 'the closet is', 'probably fine.']}
              lede="Most instruments that have been written off are a setup and a clean away from being playable again. Bring it in and we will look at it before quoting anything."
              className="[&_.marker]:text-brass-light [&_p]:text-quiet-dark"
            />

            <Reveal variant="rise" delay={200} className="mt-8">
              <div className="measure space-y-5 text-quiet-dark">
                <p className="leading-relaxed">
                  We will tell you what it needs, what it will cost, and whether it is
                  worth spending that on this particular instrument. Sometimes the answer
                  is no, and we would rather say so than take the money.
                </p>
                <p className="leading-relaxed">
                  Small jobs are often done while you wait. Bigger ones get a proper
                  estimate first, and nothing happens until you have said yes to it.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Photo
              src={images.repairsDetail.src}
              alt={images.repairsDetail.alt}
              plate={images.repairsDetail.plate}
              ratio="1 / 1"
              tone="dark"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
        </div>
      </Section>

      {/* ---- What we do ----------------------------------------------- */}
      <Section ground="walnut">
        <div className="shell">
          <SectionHeading
            kicker="What comes through"
            lines={['Work we take on.']}
            lede="Ask about anything not on this list — between us there is not much that has not been across the bench at some point."
            className="[&_.marker]:text-brass-light [&_p]:text-quiet-dark"
          />

          <RevealStagger as="ul" className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {repairServices.map((service, i) => (
              <li
                key={service.name}
                className="border-t border-rule-dark pt-5"
                style={{ '--i': i } as React.CSSProperties}
              >
                <h3 className="font-display text-2xl">{service.name}</h3>
                <p className="measure-narrow mt-2 text-quiet-dark">{service.detail}</p>
              </li>
            ))}
          </RevealStagger>

          <Reveal variant="fade" delay={200} className="mt-14">
            <p className="measure text-sm text-quiet-dark">
              Turnaround depends on what is already on the bench and whether parts have
              to be ordered. We will give you a realistic date rather than an optimistic
              one.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ---- Booking form ---------------------------------------------- */}
      <Section ground="paper" id="book">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              kicker="Book it in"
              lines={['Tell us what', 'it is doing.']}
              lede={
                <>
                  Describe the problem in whatever words you have — &ldquo;it buzzes on the
                  low strings&rdquo; is a perfectly good diagnosis to start from. No
                  account needed.
                </>
              }
            />

            <Reveal variant="rise" delay={220} className="mt-10">
              <div className="border-l-2 border-brass pl-6">
                <p className="font-medium">Or just bring it in.</p>
                <p className="measure-narrow mt-2 text-quiet-light">
                  You do not need an appointment. The bench is at the back of the shop and
                  somebody will look at it while you are standing there.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Suspense fallback={null}>
              <EnquiryForm defaultTopic="repair" showInstrument />
            </Suspense>
          </div>
        </div>
      </Section>

      <CTASection
        lines={['Past saving?', 'We have others.']}
        lede="If it really is finished, there is a wall of instruments out front and somebody who will help you find the right one."
        primary={{ href: '/shop', label: 'Shop instruments' }}
        secondary={{ href: '/pro-audio', label: 'Pro audio services' }}
      />
    </>
  );
}
