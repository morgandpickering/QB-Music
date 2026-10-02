import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Photo } from '@/components/media/Photo';
import { Plate } from '@/components/media/Plate';
import { CTASection } from '@/components/site/CTASection';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal, RevealStagger } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { TeamGrid } from '@/components/site/TeamGrid';
import { lessonSubjects, staff } from '@/config/services';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Lessons',
  description:
    'Private music lessons at Quattlebaum Music in Searcy, Arkansas — guitar, bass, piano, drums, voice, and band instruments, taught by working musicians.',
  alternates: { canonical: '/lessons' },
};

export default function LessonsPage() {
  // Everyone on the team whose role includes teaching. Drawn from the same
  // single list as the About page, so nobody has to be kept in step by hand.
  const teachers = staff.filter((person) => person.teaches);

  return (
    <>
      <PageHero
        kicker="Lessons"
        lines={['Learn', 'to play.']}
        lede="Private instruction in the rooms at the back of the shop, taught by people who play for a living. Beginners are the point, not an inconvenience."
        image={images.lessonsHero}
        actions={
          <>
            <Button href="#ask" ground="dark" variant="solid" size="lg">
              Ask about lessons
            </Button>
            <Button href="/shop" ground="dark" variant="outline" size="lg">
              Find an instrument
            </Button>
          </>
        }
      />

      {/* ---- How it works -------------------------------------------- */}
      <Section ground="paper">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHeading
              kicker="How it works"
              lines={['One teacher,', 'one student,', 'one hour a week.']}
              lede="Lessons are one to one and paced to the person, not to a syllabus. We will ask what you actually want to play — that matters far more than what a method book thinks you should be learning in week three."
            />
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
            <Reveal variant="rise" delay={120}>
              <div className="space-y-6 text-quiet-light">
                <p className="measure leading-relaxed">
                  Most students come weekly and most stay for years. Some come for six
                  weeks to get over a hump and then go away happy, which is also a fine
                  outcome.
                </p>
                <p className="measure leading-relaxed">
                  Children and adults both. Parents are welcome to sit in. If you are an
                  adult who quit at fourteen and has regretted it since, you are in
                  extremely common company.
                </p>
                <p className="measure leading-relaxed">
                  You do not need to own an instrument to start — talk to us first and we
                  will tell you honestly what is worth buying and what is not.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---- Subjects ------------------------------------------------- */}
      <Section ground="ink">
        <div className="shell">
          <SectionHeading
            kicker="Ask about"
            lines={['What we can', 'teach you.']}
            lede="Availability depends on which teachers have room this term, so ask and we will tell you exactly what is open rather than sending you a timetable that went out of date in September."
            className="[&_.marker]:text-brass-light [&_p]:text-quiet-dark"
          />

          <RevealStagger
            as="ul"
            className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            {lessonSubjects.map((subject, i) => (
              <li key={subject.name} style={{ '--i': i } as React.CSSProperties}>
                <div className="relative aspect-[3/2] overflow-hidden bg-walnut">
                  <Plate kind={subject.plate} tone="dark" className="h-full w-full" />
                </div>
                <h3 className="mt-5 font-display text-2xl">{subject.name}</h3>
                <p className="measure-narrow mt-2 text-quiet-dark">{subject.note}</p>
              </li>
            ))}
          </RevealStagger>
        </div>
      </Section>

      {/* ---- Instructors ---------------------------------------------- */}
      <Section ground="parchment">
        <div className="shell">
          <SectionHeading
            kicker="Who teaches"
            lines={['Taught by people', 'who still gig.']}
            lede="Our teachers play — in churches, in bars, in pits, on records. That is the difference between learning an instrument and learning music."
          />

          <div className="mt-16">
            <TeamGrid people={teachers} />
          </div>

          <Reveal variant="rise" delay={160} className="mt-14">
            <div className="measure border-l-2 border-brass pl-6">
              <p className="text-lg">Which of them teaches what you want to learn?</p>
              <p className="mt-3 text-quiet-light">
                That depends on who has room this term, so ask rather than guess — we
                will match you with the right person and you can see the room before
                committing to anything.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---- Enquiry --------------------------------------------------- */}
      <Section ground="paper" id="ask">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              kicker="Get started"
              lines={['Ask about', 'lessons.']}
              lede="No booking system, no account, no card up front. Tell us who is learning and what they want to play, and someone will get back to you with what is open."
            />
          </div>

          <div className="lg:col-span-7">
            <Suspense fallback={null}>
              <EnquiryForm defaultTopic="lessons" />
            </Suspense>
          </div>
        </div>
      </Section>

      <CTASection
        lines={['Need something to practise on?']}
        lede="We will set up a first guitar properly so it plays easily. That single thing decides more beginners than talent does."
        primary={{ href: '/shop', label: 'Shop instruments' }}
        secondary={{ href: '/repairs', label: 'Repairs & services' }}
      />
    </>
  );
}
