import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhoneLink } from '@/components/site/StoreFacts';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import { business } from '@/config/business';
import { getPolicy, policies } from '@/config/policies';

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};

  return {
    title: policy.title,
    description: policy.summary,
    alternates: { canonical: `/policies/${policy.slug}` },
    // A page that says "this policy is not written yet" should not be in
    // search results under the shop's name.
    robots: policy.status === 'published' ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <>
      <header className="bg-ink pb-12 pt-16 text-paper md:pt-24">
        <div className="shell">
          <Reveal variant="fade" immediate>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-quiet-dark">
                <li>
                  <Link href="/" className="link-draw hover:text-paper">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-brass-light">Customer service</li>
              </ol>
            </nav>
          </Reveal>

          <RevealLines
            as="h1"
            lines={[policy.title]}
            immediate
            delay={80}
            className="mt-5 text-4xl md:text-5xl"
          />
        </div>
      </header>

      <div className="bg-paper py-16 text-ink on-light md:py-20">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              {policy.status === 'published' && policy.body ? (
                <div className="space-y-5">
                  {policy.body.map((paragraph, i) => (
                    <p key={i} className="measure leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <>
                  {/*
                    A visible, honest notice rather than invented legal text.
                    See config/policies.ts for why.
                  */}
                  <div className="border-l-2 border-burgundy pl-5">
                    <p className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-burgundy">
                      Not yet published
                    </p>
                    <p className="measure mt-3 leading-relaxed">
                      This policy has not been finalised, and we would rather leave it
                      blank than publish something nobody at the shop has agreed to.
                      Until it is here, {business.name} will answer any question about{' '}
                      {policy.title.toLowerCase()} directly — call the shop and ask for
                      a straight answer.
                    </p>
                  </div>

                  <h2 className="mt-12 font-display text-2xl">What this page will cover</h2>
                  <ul className="measure mt-5 space-y-3">
                    {policy.covers.map((item) => (
                      <li key={item} className="flex gap-3 leading-relaxed">
                        <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-brass" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="border border-rule-light p-6">
                <h2 className="font-display text-xl">Ask us directly</h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-quiet-light">
                  Somebody at the counter can answer this today, and the answer they
                  give is the one that counts.
                </p>

                <div className="mt-5 flex flex-col items-start gap-2">
                  <PhoneLink className="text-lg font-medium" />
                  <Link href="/contact" className="link-draw font-medium">
                    Send us a message
                  </Link>
                </div>

                <div className="mt-6 border-t border-rule-light pt-5">
                  <h3 className="font-sans text-sm font-semibold">Other policies</h3>
                  <ul className="mt-3 space-y-2 text-[0.9375rem]">
                    {policies
                      .filter((other) => other.slug !== policy.slug)
                      .map((other) => (
                        <li key={other.slug}>
                          <Link
                            href={`/policies/${other.slug}`}
                            className="link-draw text-quiet-light hover:text-ink"
                          >
                            {other.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
