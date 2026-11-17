import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Headset, Palette, ShieldCheck, Tag, Wallet, Star } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DestinationCard, PackageCard } from "@/components/site/cards";
import { HeroSearch } from "@/components/site/hero-search";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { getSetting } from "@/server/services/catalog";
import { currentWishlistIds } from "@/server/services/wishlist";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const icons = [Headset, Wallet, ShieldCheck, Palette];

export default async function HomePage() {
  const live = { isPublished: true, deletedAt: null } as const;
  const [hero, why, destinations, trending, luxury, categories, reviews, coupons, blogs, destOptions, pkgs, wished] = await Promise.all([
    getSetting("site.hero", { heading: "Discover India, One Journey at a Time", subtitle: "" }),
    getSetting<{ title: string; text: string }[]>("site.whyUs", []),
    db.destination.findMany({ where: live, orderBy: { popularity: "desc" }, take: 8, include: { category: { select: { name: true } }, _count: { select: { packages: { where: live } } } } }),
    db.tourPackage.findMany({ where: { ...live, isAvailable: true }, orderBy: { popularity: "desc" }, take: 6, include: { destination: { select: { name: true, state: true } } } }),
    db.tourPackage.findMany({ where: { ...live, isAvailable: true, tier: { in: ["LUXURY", "PREMIUM"] }, isFeatured: true }, take: 3, include: { destination: { select: { name: true } } } }),
    db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { destinations: { where: live, take: 1, select: { coverImage: true } }, _count: { select: { destinations: true } } } }),
    db.review.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 3, include: { user: { select: { name: true } }, package: { select: { name: true } } } }),
    db.coupon.findMany({ where: { isActive: true, showOnHome: true, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] }, take: 3 }),
    db.blog.findMany({ where: { ...live, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 3, include: { category: true } }),
    db.destination.findMany({ where: live, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    db.tourPackage.findMany({ where: live, select: { departureCities: true } }),
    currentWishlistIds(),
  ]);
  const cities = [...new Set(pkgs.flatMap((p) => p.departureCities))].sort();
  const heroImg = destinations[0]?.coverImage;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-800 text-white">
        {heroImg && <Image src={heroImg} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-900/60 via-navy-900/30 to-navy-900/80" />
        <div className="container pb-24 pt-20 md:pb-32 md:pt-32">
          <Reveal>
            <p className="eyebrow !text-gold-200">Curated travel across India</p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] md:text-6xl">{hero.heading}</h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">{hero.subtitle}</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10"><HeroSearch destinations={destOptions} cities={cities} /></Reveal>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="section container">
        <SectionHeading eyebrow="Popular destinations" title="Where will India take you next?" sub="From Himalayan snow to Kerala backwaters — the places travellers love most." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d, i) => <Reveal key={d.id} delay={(i % 4) * 0.06}><DestinationCard d={d} /></Reveal>)}
        </div>
        <div className="mt-8 text-center"><Button asChild variant="outline"><Link href="/destinations">View all destinations <ArrowRight className="h-4 w-4" /></Link></Button></div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16">
        <div className="container">
          <SectionHeading center eyebrow="Travel your way" title="Explore by travel style" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {categories.map((c) => (
              <Link key={c.id} href={`/destinations?category=${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                {c.destinations[0] && <Image src={c.destinations[0].coverImage} alt="" fill sizes="20vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-navy-900/55 transition group-hover:bg-navy-900/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white">
                  <span className="font-serif text-lg leading-tight">{c.name}</span>
                  <span className="mt-1 text-xs text-white/70">{c._count.destinations} destinations</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending packages */}
      <section className="section container">
        <SectionHeading eyebrow="Trending now" title="Most-booked tour packages" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trending.map((p) => <Reveal key={p.id}><PackageCard p={p} wished={wished.has(p.id)} /></Reveal>)}
        </div>
        <div className="mt-8 text-center"><Button asChild><Link href="/packages">Browse all packages <ArrowRight className="h-4 w-4" /></Link></Button></div>
      </section>

      {/* Why choose us */}
      <section className="bg-navy-800 py-20 text-white">
        <div className="container">
          <SectionHeading center eyebrow="Why Voyara" title="Travel planned like family would plan it" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {why.map((w, i) => { const Icon = icons[i % icons.length]; return (
              <Reveal key={w.title} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <Icon className="h-8 w-8 text-gold" />
                  <h3 className="mt-4 font-serif text-xl">{w.title}</h3>
                  <p className="mt-2 text-sm text-navy-200">{w.text}</p>
                </div>
              </Reveal>); })}
          </div>
        </div>
      </section>

      {/* Featured experiences */}
      {luxury.length > 0 && (
        <section className="section container">
          <SectionHeading eyebrow="Featured experiences" title="Signature journeys, handpicked" />
          <div className="grid gap-6 md:grid-cols-3">
            {luxury.map((p) => (
              <Link key={p.id} href={`/packages/${p.slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-card">
                <Image src={p.coverImage} alt={p.name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white"><p className="eyebrow !text-gold-200">{p.destination.name}</p><h3 className="mt-1 font-serif text-2xl">{p.name}</h3><p className="mt-1 text-sm text-white/75 line-clamp-2">{p.summary}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Offers */}
      {coupons.length > 0 && (
        <section className="bg-gold-50 py-14">
          <div className="container">
            <SectionHeading eyebrow="Special offers" title="Save more on your next trip" />
            <div className="grid gap-4 md:grid-cols-3">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-dashed border-gold bg-white p-5">
                  <Tag className="h-8 w-8 text-gold-600" />
                  <div><p className="font-mono text-lg font-bold tracking-wider">{c.code}</p><p className="text-sm text-navy-400">{c.description}</p>{c.validUntil && <p className="text-xs text-navy-300">Valid till {formatDate(c.validUntil)}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="section container">
          <SectionHeading center eyebrow="Loved by travellers" title="Stories from the road" />
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card p-6">
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-gold text-gold" : "text-navy-200"}`} />)}</div>
                <blockquote className="mt-4 text-navy-600">“{r.body}”</blockquote>
                <figcaption className="mt-4 text-sm"><b>{r.user.name}</b>{r.package && <span className="text-navy-400"> · {r.package.name}</span>}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Blog */}
      {blogs.length > 0 && (
        <section className="container pb-8">
          <SectionHeading eyebrow="Travel inspiration" title="Guides & stories" />
          <div className="grid gap-6 md:grid-cols-3">
            {blogs.map((b) => (
              <Link key={b.id} href={`/blog/${b.slug}`} className="card group overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden"><Image src={b.coverImage} alt={b.title} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <div className="p-5"><p className="eyebrow">{b.category?.name}</p><h3 className="mt-1 font-serif text-xl group-hover:text-gold-600">{b.title}</h3><p className="mt-2 line-clamp-2 text-sm text-navy-400">{b.excerpt}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container mt-16">
        <div className="rounded-3xl bg-navy-800 px-6 py-14 text-center text-white">
          <h2 className="text-3xl">Get travel inspiration in your inbox</h2>
          <p className="mx-auto mb-6 mt-2 max-w-lg text-navy-200">Seasonal destination guides and subscriber-only offers. No spam, unsubscribe anytime.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
