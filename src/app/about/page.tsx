import type { Metadata } from 'next';
import Link from 'next/link';
import { Photo } from '@/components/media/Photo';
import { TeamGrid } from '@/components/site/TeamGrid';
import { CTASection } from '@/components/site/CTASection';
import { Figures, type Figure } from '@/components/home/Figures';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal, RevealStagger } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { staff } from '@/config/services';
import { yearsInBusiness } from '@/config/business';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Quattlebaum Music has been selling, teaching, and repairing instruments in downtown Searcy, Arkansas for a long time. This is who we are and how we work.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const years = yearsInBusiness();
  const figures: Figure[] = [
    ...(years !== null ? [{ value: years, suffix: '+', label: 'Years on this street' }] : []),
    { text: 'Locally owned', label: 'Not a chain, never has been' },
    { text: 'Downtown Searcy', label: '101 W. Arch St.' },
  ];

  return (
    <>
      <PageHero
        kicker="About"
        lines={['Music has always', 'been personal here.']}
        lede="A counter, a wall of instruments, a bench at the back, and people who would rather talk you out of the wrong purchase than into the expensive one."
        image={images.aboutHero}
      />

      {/* ---- Story ----------------------------------------------------- */}
      <Section ground="paper" pad="loose">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHeading
              kicker="How it works here"
              lines={['A shop, not', 'a warehouse.']}
            />

            <Reveal variant="rise" delay={140} className="mt-8">
              <div className="measure space-y-6 text-lg leading-relaxed text-quiet-light">
                <p>
                  You can plug something in. You can sit at the kit. You can take a guitar
                  off the wall and find out in ninety seconds that it is not for you,
                  which is information no photograph will ever give you.
                </p>
                <p>
                  Nobody works on commission and nobody is going to talk a parent into
                  spending nine hundred dollars on a twelve year old who started last
                  month. If the two hundred dollar guitar is the right answer, that is the
                  answer you will get.
                </p>
                <p>
                  The same bench that sets up a beginner&rsquo;s first acoustic services
                  the school band&rsquo;s horns and recaps the amplifier that has been
                  through four owners. That is the part that keeps people coming back
                  decades later.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Photo
              src={images.aboutArchive.src}
              alt={images.aboutArchive.alt}
              plate={images.aboutArchive.plate}
              ratio={images.aboutArchive.ratio}
              tone="light"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <Reveal variant="fade" delay={200} className="mt-4">
              <p className="text-sm text-quiet-light">
                From the shop&rsquo;s own records. If you have an old photograph of the
                store, we would genuinely like a copy.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="shell mt-20 md:mt-28">
          <div className="border-t border-rule-light pt-10 [&_dd]:text-ink [&_dt]:text-quiet-light [&>div>dl>div]:border-rule-light">
            <Figures items={figures} />
          </div>
        </div>
      </Section>

      {/* ---- What we believe -------------------------------------------- */}
      <Section ground="ink">
        <div className="shell">
          <SectionHeading
            kicker="How we sell"
            lines={['Four things we', 'will not do.']}
            className="[&_.marker]:text-brass-light"
          />

          <RevealStagger as="ul" className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {[
              [
                'Sell you more than you need',
                'The right instrument is the one that suits how you actually play, at a price that does not put you off playing it.',
              ],
              [
                'Pretend everything is worth fixing',
                'Sometimes the honest answer is that the repair costs more than the instrument. We will say so.',
              ],
              [
                'Make you feel stupid for asking',
                'Everyone started somewhere. Nobody here has ever been impressed by making a beginner feel small.',
              ],
              [
                'Disappear after the sale',
                'The bench, the advice, and the phone number are all still here in five years. That is rather the point of a local shop.',
              ],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="border-t border-rule-dark pt-5"
                style={{ '--i': i } as React.CSSProperties}
              >
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="measure-narrow mt-3 text-quiet-dark">{body}</p>
              </li>
            ))}
          </RevealStagger>
        </div>
      </Section>

      {/* ---- People ------------------------------------------------------ */}
      <Section ground="parchment">
        <div className="shell">
          <SectionHeading
            kicker="The people"
            lines={['Talk to someone', 'who knows music.']}
            lede="Everybody behind the counter plays something. That is not a hiring policy so much as an inevitability."
          />

          <div className="mt-16">
            <TeamGrid people={staff} />
          </div>

          <Reveal variant="rise" delay={160} className="mt-16">
            <p className="measure text-quiet-light">
              Between them they cover sales, repairs, lessons, and everything that has
              to happen before an instrument is worth taking home.{' '}
              <Link href="/contact" className="link-draw font-medium text-ink">
                Come and meet them in downtown Searcy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </Section>

      <CTASection
        lines={['Come in looking for a guitar.', 'Stay to talk about music.']}
        lede="101 W. Arch St., downtown Searcy. The amps are on."
        primary={{ href: '/contact', label: 'Visit the store' }}
        secondary={{ href: '/shop', label: 'Shop instruments' }}
      />
    </>
  );
}
