import Link from 'next/link';
import type { Metadata } from 'next';
import { BenefitStrip } from '@/components/home/BenefitStrip';
import { BrandMarquee } from '@/components/home/BrandMarquee';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { FeatureSplit } from '@/components/home/FeatureSplit';
import { HeroStrings } from '@/components/home/HeroStrings';
import { Photo } from '@/components/media/Photo';
import { MapPanel } from '@/components/site/MapPanel';
import { AddressBlock, DirectionsLink, HoursTable, PhoneLink } from '@/components/site/StoreFacts';
import { ProductRail } from '@/components/store/ProductRail';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealLines, RevealStagger } from '@/components/ui/Reveal';
import { LabelledRule, Section, SectionHeading } from '@/components/ui/Section';
import { business, directionsUrl, yearsInBusiness } from '@/config/business';
import { lessonSubjects, repairServices } from '@/config/services';
import { images } from '@/lib/images';
import {
  getBrandSummaries,
  getCategories,
  getNewArrivals,
  getUsedProducts,
} from '@/lib/products/repository';

export const metadata: Metadata = {
  title: 'Quattlebaum Music — Music Store in Searcy, Arkansas',
  description:
    'Guitars, drums, keyboards, band instruments and pro audio, plus music lessons and instrument repair, from a locally owned music store at 101 W. Arch St. in downtown Searcy, Arkansas.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [categories, arrivals, used, brands] = await Promise.all([
    getCategories(),
    getNewArrivals(8),
    getUsedProducts(6),
    getBrandSummaries(),
  ]);

  const years = yearsInBusiness();

  return (
    <>
      {/* ---- 1. Hero ------------------------------------------------- */}
      {/* Shorter than the first cut (was 78/86svh): the user's read was that
          shopping was buried under it. This gets a shopper to New Arrivals
          within about two desktop viewport heights. */}
      <section className="relative isolate flex min-h-[52svh] flex-col justify-end overflow-hidden bg-ink text-paper lg:min-h-[58svh]">
        <Photo
          src={images.heroWall.src}
          alt={images.heroWall.alt}
          plate={images.heroWall.plate}
          tone="dark"
          sizes="100vw"
          priority
          fill
          className="opacity-55"
        />
        {/* Keeps the headline legible over whatever photograph lands here. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/30"
        />
        {/* Quieted, not removed: at full strength it competed with the
            merchandise the user actually wants seen first. */}
        <HeroStrings className="opacity-30" />

        <div className="shell relative pb-10 pt-14 md:pb-14 md:pt-20">
          <RevealLines
            as="h1"
            lines={['Your local music store.', 'Built for musicians.']}
            className="max-w-[16ch] text-4xl sm:text-5xl md:text-6xl"
            delay={120}
            immediate
          />

          <Reveal variant="rise" delay={520} immediate className="mt-6">
            <p className="measure text-lg leading-relaxed text-quiet-dark">
              Instruments, gear, lessons, repairs, and professional audio from a music
              store that has served Searcy musicians for generations.
            </p>
          </Reveal>

          <Reveal variant="rise" delay={640} immediate className="mt-7">
            <div className="flex flex-wrap gap-4">
              <Button href="/shop?new=1&sort=newest" ground="dark" variant="solid" size="lg">
                Shop new arrivals
              </Button>
              <Button href="/contact" ground="dark" variant="outline" size="lg">
                Visit the store
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 2. Why here --------------------------------------------- */}
      <BenefitStrip />

      {/* ---- 3. Shop by category ------------------------------------- */}
      {/* A compact strip, not the three-row tile grid the first cut used —
          that put a wall of imagery between the hero and the first product. */}
      <Section ground="ink" pad="tight">
        <div className="shell">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              kicker="Departments"
              lines={['Shop by department.']}
              className="[&_.marker]:text-brass-light"
            />
            <Reveal variant="fade" delay={160}>
              <Link href="/shop" className="link-draw shrink-0 font-medium text-brass-light">
                Shop everything
              </Link>
            </Reveal>
          </div>

          <div className="mt-8">
            <CategoryStrip categories={categories} />
          </div>
        </div>
      </Section>

      {/* ---- 4. New arrivals ----------------------------------------- */}
      {/* Tighter top padding than the section's default: the user's main
          complaint was how far down the first product sat. */}
      <Section ground="paper" pad="tight">
        <div className="shell">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              lines={['New arrivals.']}
              lede="What just went up on this list. Call before you drive over and we will tell you exactly what is on hand today."
              className="md:max-w-2xl"
            />
            <Reveal variant="fade" delay={160}>
              <Link href="/shop?new=1&sort=newest" className="link-draw shrink-0 font-medium">
                View all new arrivals
              </Link>
            </Reveal>
          </div>

          <Reveal variant="rise" delay={120} className="mt-8">
            <ProductRail products={arrivals} label="New arrivals" />
          </Reveal>
        </div>
      </Section>

      {/* ---- 5. Used & unique ---------------------------------------- */}
      <Section ground="walnut">
        <div className="shell">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              lines={['Used & unique.']}
              lede="One-of-a-kind instruments, trade-ins, and gear worth discovering. When it is gone, it is gone."
              className="md:max-w-2xl [&_.marker]:text-brass-light"
            />
            <Reveal variant="fade" delay={160}>
              <Link href="/used" className="link-draw shrink-0 font-medium text-brass-light">
                Browse used gear
              </Link>
            </Reveal>
          </div>

          <Reveal variant="rise" delay={120} className="mt-12">
            <ProductRail products={used} ground="dark" label="Used and unique gear" />
          </Reveal>
        </div>
      </Section>

      {/* ---- 6. Brands ------------------------------------------------ */}
      <Section ground="ink" pad="tight">
        <div className="shell">
          <LabelledRule label="Brands we carry" tone="dark" />

          <Reveal variant="fade" delay={120} className="mt-10">
            <BrandMarquee brands={brands} />
          </Reveal>

          <Reveal variant="rise" delay={200} className="mt-10">
            <Link href="/brands" className="link-draw font-medium text-brass-light">
              Shop all brands
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* ---- 7. The store itself ------------------------------------- */}
      <Section ground="paper" pad="loose">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Photo
              src={images.heritageStore.src}
              alt={images.heritageStore.alt}
              plate={images.heritageStore.plate}
              ratio={images.heritageStore.ratio}
              tone="light"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:pt-10">
            <SectionHeading
              kicker="101 W. Arch St., downtown Searcy"
              lines={['More than', 'a music store.']}
              lede="Quattlebaum has been part of how music gets made around here for decades — the first guitar, the school band rental, the amp that finally died, the sound system that had to be right before Sunday."
            />

            <Reveal variant="rise" delay={220} className="mt-6">
              <p className="measure leading-relaxed text-quiet-light">
                We are a counter with people behind it. You can play something before you
                buy it, ask what you actually need instead of what costs the most, and
                bring it back to the same bench when it needs work. A warehouse three
                states away cannot do any of that, and it will not know your name when
                the band needs a cable an hour before the doors open.
              </p>
            </Reveal>

            {years !== null && (
              <Reveal variant="rise" delay={260} className="mt-8">
                <p className="font-display text-3xl">
                  {years}+ <span className="text-quiet-light">years on this street</span>
                </p>
              </Reveal>
            )}

            <Reveal variant="rise" delay={300} className="mt-9">
              <div className="flex flex-wrap gap-4">
                <Button href="/about" variant="solid">
                  About Quattlebaum
                </Button>
                <Button href="/about#team" variant="outline">
                  Meet the team
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---- 8. Lessons ----------------------------------------------- */}
      <Section ground="parchment">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                lines={['Learn', 'to play.']}
                lede="One-to-one instruction in the rooms at the back of the shop, taught by people who play. Beginners welcome, and nobody is too old to start."
              />

              <Reveal variant="rise" delay={240} className="mt-9">
                <div className="flex flex-wrap gap-4">
                  <Button href="/lessons" variant="solid">
                    View music lessons
                  </Button>
                  <Button href="/contact?topic=lessons" variant="outline">
                    Contact us about lessons
                  </Button>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <RevealStagger as="ul" className="grid grid-cols-2 gap-px bg-rule-light">
                {lessonSubjects.slice(0, 6).map((subject, i) => (
                  <li
                    key={subject.name}
                    className="bg-parchment p-5"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <h3 className="font-display text-xl">{subject.name}</h3>
                    <p className="mt-1.5 text-sm leading-snug text-quiet-light">
                      {subject.note}
                    </p>
                  </li>
                ))}
              </RevealStagger>

              {/*
                Deliberately not a timetable. Which lessons run, and when,
                has to come from the shop — see PENDING.md. Saying "ask" is
                better than publishing a schedule nobody confirmed.
              */}
              <Reveal variant="fade" delay={200}>
                <p className="mt-5 text-sm text-quiet-light">
                  Ask us which of these are running at the moment and who is taking new
                  students.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ---- 9. Repairs ------------------------------------------------ */}
      <Section ground="ink">
        <FeatureSplit
          kicker="Repairs & service"
          lines={['Keep your instrument', 'playing its best.']}
          body="Restringing, setups, neck adjustments, pickup installation, electronics, routine maintenance, and orchestral instrument service. Bring in the thing that has been in the closet for ten years and we will tell you honestly whether it is worth fixing."
          image={images.repairs}
          cta={{ href: '/repairs', label: 'View repair services' }}
          ground="dark"
          notes={repairServices.slice(0, 4).map((service) => service.name)}
        />
      </Section>

      {/* ---- 10. Pro audio --------------------------------------------- */}
      <Section ground="walnut">
        <FeatureSplit
          kicker="Pro audio & sound systems"
          lines={['Make the whole', 'room hear it.']}
          body="Sound systems for churches, schools, auditoriums, athletic facilities, and local venues. We come and listen to the room first, then design something the people who have to run it every week can actually run — and we stay to train them on it."
          image={images.proAudio}
          cta={{ href: '/contact?topic=pro-audio', label: 'Talk to us about your system' }}
          ground="dark"
          flip
          notes={[
            'Equipment recommendations and system design',
            'PA systems, installation, and balancing',
            'Evaluation and upgrades to what you already own',
          ]}
        />
      </Section>

      {/* ---- 11. Visit -------------------------------------------------- */}
      <Section ground="paper" pad="loose">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              lines={['Come play', 'something.']}
              lede="You are welcome to spend an hour here without buying anything. Most people who do end up coming back."
            />

            <Reveal variant="rise" delay={220} className="mt-9 space-y-7">
              <AddressBlock className="text-lg" />

              <div>
                <h3 className="font-sans text-sm font-semibold">Opening hours</h3>
                <HoursTable className="mt-2 text-[0.9375rem] text-quiet-light" />
              </div>

              <div className="flex flex-wrap gap-4">
                <Button href={directionsUrl} external variant="solid">
                  Get directions
                </Button>
                {business.phone && (
                  <Button href={`tel:${business.phone}`} variant="outline">
                    Call the store
                  </Button>
                )}
                <Button href="/contact" variant="quiet">
                  Contact us
                </Button>
              </div>

              <div className="flex flex-col items-start gap-2">
                <PhoneLink className="text-lg" />
                <DirectionsLink />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <MapPanel ratio="4 / 3" />
          </div>
        </div>
      </Section>
    </>
  );
}
