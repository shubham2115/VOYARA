import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bed, Bus, Check, Clock, Download, Info, MapPin, Star, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { PackageCard } from "@/components/site/cards";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { SectionHeading } from "@/components/site/reveal";
import { getPackage, relatedPackages } from "@/server/services/catalog";
import { currentWishlistIds } from "@/server/services/wishlist";
import { getCurrentUser } from "@/lib/session";
import { formatINR, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPackage((await params).slug);
  if (!p) return {};
  return { title: p.name, description: p.summary, openGraph: { images: [p.coverImage] } };
}

export default async function PackagePage({ params }: Props) {
  const p = await getPackage((await params).slug);
  if (!p) notFound();
  const [related, wished, user] = await Promise.all([relatedPackages(p.id, p.destinationId), currentWishlistIds(), getCurrentUser()]);
  const final = p.discountedPrice ?? p.price;
  const gallery = [{ id: "cover", url: p.coverImage, alt: p.name }, ...p.images];

  const ld = {
    "@context": "https://schema.org", "@type": "TouristTrip", name: p.name, description: p.summary,
    offers: { "@type": "Offer", price: final, priceCurrency: "INR" },
    ...(p.ratingCount > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingAvg, reviewCount: p.ratingCount } }),
  };

  return (
    <div className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-navy-400">
        <Link href="/packages" className="hover:underline">Packages</Link> / <Link href={`/destinations/${p.destination.slug}`} className="hover:underline">{p.destination.name}</Link>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1 text-sm font-medium text-gold-600"><MapPin className="h-4 w-4" /> {p.destination.name}, {p.destination.state}</p>
          <h1 className="mt-1 text-3xl md:text-5xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-navy-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {p.durationNights} Nights / {p.durationDays} Days</span>
            {p.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" /> {p.ratingAvg.toFixed(1)} ({p.ratingCount})</span>}
            {p.themes.map((t) => <Badge key={t} tone="gold">{t}</Badge>)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:h-[460px]">
        {gallery.slice(0, 4).map((g, i) => (
          <div key={g.id} className={`relative ${i === 0 ? "col-span-4 row-span-2 aspect-[16/9] md:col-span-2 md:aspect-auto" : "hidden md:block"} ${i === 1 ? "col-span-2" : ""}`}>
            <Image src={g.url} alt={g.alt ?? p.name} fill priority={i === 0} sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          <section><h2 className="text-2xl">Overview</h2><p className="mt-3 leading-relaxed text-navy-600">{p.summary}</p></section>

          <section aria-label="Quick details" className="grid gap-4 sm:grid-cols-3">
            {[{ i: Bed, t: "Hotel", v: p.hotelInfo }, { i: Bus, t: "Transport", v: p.transportInfo }, { i: Utensils, t: "Meals", v: "Breakfast & dinner daily" }].filter((x) => x.v).map((x) => (
              <div key={x.t} className="card p-4"><x.i className="h-5 w-5 text-gold-600" /><p className="mt-2 text-xs uppercase tracking-wide text-navy-300">{x.t}</p><p className="text-sm">{x.v}</p></div>
            ))}
          </section>

          <section>
            <h2 className="mb-5 text-2xl">Day-wise itinerary</h2>
            <ol className="relative space-y-6 border-l-2 border-gold-200 pl-6">
              {p.itinerary.map((d) => (
                <li key={d.id} className="relative">
                  <span className="absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{d.dayNumber}</span>
                  <h3 className="font-serif text-lg">Day {d.dayNumber}: {d.title}</h3>
                  <p className="mt-1 text-navy-600">{d.description}</p>
                  <p className="mt-1 text-xs text-navy-400">{d.meals.length ? `Meals: ${d.meals.map(humanize).join(", ")}` : "No meals"}{d.stay && ` · Stay: ${d.stay}`}</p>
                </li>
              ))}
            </ol>
            <Button asChild variant="outline" size="sm" className="mt-5"><a href={`/api/packages/${p.slug}/itinerary`}><Download className="h-4 w-4" /> Download itinerary PDF</a></Button>
          </section>

          {p.activities.length > 0 && <section><h2 className="mb-3 text-2xl">Activities</h2><div className="flex flex-wrap gap-2">{p.activities.map((a) => <Badge key={a} tone="navy" className="px-3 py-1 text-sm">{a}</Badge>)}</div></section>}

          <section className="grid gap-6 md:grid-cols-2">
            <div><h2 className="mb-3 text-2xl">Inclusions</h2><ul className="space-y-2">{p.inclusions.map((i) => <li key={i.id} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{i.text}</li>)}</ul></div>
            <div><h2 className="mb-3 text-2xl">Exclusions</h2><ul className="space-y-2">{p.exclusions.map((i) => <li key={i.id} className="flex gap-2 text-sm"><X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />{i.text}</li>)}</ul></div>
          </section>

          {p.importantInfo && <section className="rounded-2xl bg-gold-50 p-5"><h2 className="flex items-center gap-2 text-lg"><Info className="h-5 w-5 text-gold-600" /> Important information</h2><p className="mt-2 text-sm text-navy-600">{p.importantInfo}</p></section>}
          {p.cancellationPolicy && <section><h2 className="text-2xl">Cancellation policy</h2><p className="mt-2 text-sm text-navy-600">{p.cancellationPolicy}</p></section>}

          <section>
            <h2 className="mb-4 text-2xl">Reviews</h2>
            {p.reviews.length === 0 ? <p className="text-navy-400">No reviews yet. Completed-trip customers can leave one from their dashboard.</p> : (
              <div className="grid gap-4 md:grid-cols-2">{p.reviews.map((r) => (
                <figure key={r.id} className="card p-5"><div className="flex gap-0.5">{Array.from({ length: r.rating }, (_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}</div>{r.title && <p className="mt-2 font-medium">{r.title}</p>}<blockquote className="mt-1 text-sm text-navy-600">{r.body}</blockquote><figcaption className="mt-2 text-sm font-medium">{r.user.name} <Badge tone="green" className="ml-1">Verified trip</Badge></figcaption></figure>
              ))}</div>
            )}
          </section>
        </div>

        <aside id="book" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            {p.discountedPrice && <p className="text-sm text-navy-300 line-through">{formatINR(p.price)}</p>}
            <p className="font-serif text-4xl">{formatINR(final)} <span className="font-sans text-sm text-navy-400">per person</span></p>
            <p className="mb-5 mt-1 text-xs text-navy-400">Taxes as applicable. Final price confirmed in your quotation.</p>
            <EnquiryForm packageId={p.id} destinationId={p.destinationId} user={user} />
            <Button asChild variant="outline" className="mt-3 w-full"><Link href={`/customize-trip?package=${p.slug}`}>Customize This Trip</Link></Button>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16"><SectionHeading title="You may also like" /><div className="grid gap-6 md:grid-cols-3">{related.map((r) => <PackageCard key={r.id} p={r} wished={wished.has(r.id)} />)}</div></section>
      )}
    </div>
  );
}
