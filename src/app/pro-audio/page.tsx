import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Photo } from '@/components/media/Photo';
import { ProcessScroller } from '@/components/proaudio/ProcessScroller';
import { CTASection } from '@/components/site/CTASection';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal, RevealStagger } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { proAudioClients } from '@/config/services';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Pro Audio',
  description:
    'Sound system design and installation for churches, schools, auditoriums, and venues in central Arkansas, from Quattlebaum Music in Searcy.',
  alternates: { canonical: '/pro-audio' },
};

export default function ProAudioPage() {
  return (
    <>
      <PageHero
        kicker="Professional audio"
        lines={['Make the whole', 'room hear it.']}
        lede="Sound systems designed, installed, and supported for buildings that have to sound right every week — not just on the day the installer signs off."
        image={images.proAudioHero}
        actions={
          <>
            <Button href="#enquire" ground="dark" variant="solid" size="lg">
              Talk about your room
            </Button>
            <Button href="/shop/pro-audio" ground="dark" variant="outline" size="lg">
              Shop pro audio
            </Button>
          </>
        }
      />

      {/* ---- The problem ---------------------------------------------- */}
      <Section ground="paper">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHeading
              kicker="The usual story"
              lines={['Most rooms do not', 'have a gear problem.']}
              lede="They have a coverage problem, a gain-structure problem, or a nobody-was-shown-how-to-use-it problem. Buying a bigger speaker almost never fixes any of those."
            />
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
            <Reveal variant="rise" delay={140}>
              <div className="measure space-y-5 leading-relaxed text-quiet-light">
                <p>
                  If the back three rows cannot hear the speaker but the front row is
                  getting blasted, that is aiming and coverage. If everything distorts
                  before it gets loud, that is headroom and gain. If it sounded fine at
                  the demo and terrible on Sunday, that is the room.
                </p>
                <p>
                  We work these out first, in the building, with people standing in it.
                  Then we specify equipment — which is the last decision, not the first.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---- Process --------------------------------------------------- */}
      <Section ground="ink" pad="loose">
        <div className="shell mb-16">
          <SectionHeading
            kicker="How an install goes"
            lines={['Evaluate, design,', 'install, support.']}
            className="[&_.marker]:text-brass-light"
          />
        </div>
        <ProcessScroller />
      </Section>

      {/* ---- Who we work with ------------------------------------------ */}
      <Section ground="parchment">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              kicker="Who this is for"
              lines={['Rooms full', 'of people.']}
              lede="If somebody at the back needs to hear somebody at the front, it is the same problem whatever the building is called."
            />

            <RevealStagger as="ul" className="mt-10 flex flex-wrap gap-x-3 gap-y-3">
              {proAudioClients.map((client, i) => (
                <li
                  key={client}
                  style={{ '--i': i } as React.CSSProperties}
                  className="border border-rule-light px-4 py-2 text-[0.9375rem]"
                >
                  {client}
                </li>
              ))}
            </RevealStagger>

            <Reveal variant="rise" delay={280} className="mt-10">
              <p className="measure text-quiet-light">
                We also fix and extend systems somebody else put in. You do not have to
                start again to get a room working properly.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Photo
              src={images.proAudioRoom.src}
              alt={images.proAudioRoom.alt}
              plate={images.proAudioRoom.plate}
              ratio={images.proAudioRoom.ratio}
              tone="light"
              sizes="(min-width: 1024px) 56vw, 100vw"
            />
          </div>
        </div>
      </Section>

      {/* ---- Plain language -------------------------------------------- */}
      <Section ground="paper" pad="tight">
        <div className="shell shell-tight">
          <SectionHeading
            kicker="In plain terms"
            lines={['You do not need to', 'know any of this.']}
            lede="You will not be asked to choose between two model numbers. Tell us what the room is for and who has to run it, and we will handle the rest in language that makes sense."
          />

          <Reveal variant="rise" delay={180} className="mt-10">
            <dl className="divide-y divide-rule-light border-y border-rule-light">
              {[
                ['Coverage', 'Whether everyone in the room can hear clearly, wherever they sit.'],
                ['Headroom', 'How much louder the system can go before it starts to sound bad.'],
                ['Gain structure', 'Setting levels through the chain so nothing hisses or distorts.'],
                ['Tuning', 'Adjusting the system to suit the room it is actually in.'],
              ].map(([term, definition]) => (
                <div key={term} className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-medium">{term}</dt>
                  <dd className="text-quiet-light">{definition}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Section>

      {/* ---- Enquiry ---------------------------------------------------- */}
      <Section ground="parchment" id="enquire">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              kicker="Start here"
              lines={['Tell us about', 'the building.']}
              lede="Roughly how big, roughly how many people, what happens in it, and what is going wrong now. That is enough for a first conversation."
            />
            <Reveal variant="rise" delay={220} className="mt-8">
              <p className="measure text-quiet-light">
                Site visits are free and there is no obligation attached to one. We would
                rather see the room than guess at it.{' '}
                <Link href="/contact" className="link-draw font-medium text-ink">
                  Or just call the shop
                </Link>
                .
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Suspense fallback={null}>
              <EnquiryForm defaultTopic="pro-audio" />
            </Suspense>
          </div>
        </div>
      </Section>

      <CTASection
        lines={['Sorting a room out', 'before Sunday?']}
        lede="Call the shop. We are in Searcy, which means we can usually be standing in your building this week rather than next month."
        primary={{ href: '/contact?topic=pro-audio', label: 'Get in touch' }}
        secondary={{ href: '/shop/pro-audio', label: 'Shop pro audio' }}
      />
    </>
  );
}
