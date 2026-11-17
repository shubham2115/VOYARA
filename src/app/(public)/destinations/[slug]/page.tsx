import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Compass, IndianRupee, MapPin, Navigation, Timer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DestinationCard, PackageCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/site/reveal";
import { getDestination } from "@/server/services/catalog";
import { currentWishlistIds } from "@/server/services/wishlist";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return {};
  return { title: `${d.name} Tour Packages & Travel Guide`, description: d.tagline ?? d.description.slice(0, 155), openGraph: { images: [d.coverImage] } };
}

export default async function DestinationPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const wished = await currentWishlistIds();
  const facts = [
    { icon: Calendar, label: "Best time to visit", value: d.bestTimeToVisit },
    { icon: Timer, label: "Recommended duration", value: d.recommendedDays },
    { icon: IndianRupee, label: "Approx. budget / person", value: d.budgetMin && d.budgetMax ? `${formatINR(d.budgetMin)} – ${formatINR(d.budgetMax)}` : null },
  ].filter((f) => f.value);
  const avg = d.reviews.length ? d.reviews.reduce((s, r) => s + r.rating, 0) / d.reviews.length : 0;

  return (
    <>
      <section className="relative isolate h-[55vh] min-h-[380px] overflow-hidden bg-navy-800 text-white">
        <Image src={d.coverImage} alt={`${d.name} cover`} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-900/85 via-navy-900/20 to-navy-900/30" />
        <div className="container flex h-full flex-col justify-end pb-10">
          <p className="flex items-center gap-1 text-sm text-gold-200"><MapPin className="h-4 w-4" /> {d.city ? `${d.city}, ` : ""}{d.state}</p>
          <h1 className="text-5xl md:text-6xl">{d.name}</h1>
          {d.tagline && <p className="mt-2 max-w-2xl text-lg text-white/80">{d.tagline}</p>}
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl">About {d.name}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-navy-600">{d.description}</p>
          </section>

          {d.images.length > 0 && (
            <section aria-label="Photo gallery">
              <h2 className="mb-4 text-2xl">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {d.images.map((img, i) => (
                  <div key={img.id} className={`relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                    <Image src={img.url} alt={img.alt ?? `${d.name} photo ${i + 1}`} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform hover:scale-105" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {d.attractions.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl">Popular attractions</h2>
              <ul className="grid gap-3 sm:grid-cols-2">{d.attractions.map((a) => <li key={a} className="card flex items-center gap-3 p-4"><Compass className="h-5 w-5 text-gold-600" /> {a}</li>)}</ul>
            </section>
          )}

          {d.howToReach && (
            <section><h2 className="text-2xl">How to reach</h2><p className="mt-3 flex gap-3 text-navy-600"><Navigation className="mt-1 h-5 w-5 shrink-0 text-gold-600" /> {d.howToReach}</p></section>
          )}

          <section>
            <SectionHeading title={`Tour packages in ${d.name}`} />
            {d.packages.length === 0 ? (
              <div className="card p-6">No fixed packages yet — <Link className="font-semibold underline" href={`/customize-trip?destination=${d.slug}`}>design a custom trip</Link>.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">{d.packages.map((p) => <PackageCard key={p.id} p={p} wished={wished.has(p.id)} />)}</div>
            )}
          </section>

          {d.nearby.length > 0 && (
            <section>
              <SectionHeading title="Nearby destinations" />
              <div className="grid gap-5 sm:grid-cols-3">{d.nearby.map((n) => <DestinationCard key={n.id} d={n} />)}</div>
            </section>
          )}

          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl">Traveller reviews {avg > 0 && <span className="flex items-center gap-1 text-base font-sans text-navy-400"><Star className="h-4 w-4 fill-gold text-gold" /> {avg.toFixed(1)}</span>}</h2>
            {d.reviews.length === 0 ? <p className="text-navy-400">No reviews yet for this destination.</p> : (
              <div className="grid gap-4 md:grid-cols-2">{d.reviews.map((r) => (
                <figure key={r.id} className="card p-5"><div className="flex gap-0.5">{Array.from({ length: r.rating }, (_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}</div><blockquote className="mt-2 text-sm text-navy-600">{r.body}</blockquote><figcaption className="mt-2 text-sm font-medium">{r.user.name}</figcaption></figure>
              ))}</div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-5 p-6">
            <h3 className="font-serif text-xl">Trip essentials</h3>
            {facts.map((f) => (
              <div key={f.label} className="flex gap-3"><f.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" /><div><p className="text-xs uppercase tracking-wide text-navy-300">{f.label}</p><p className="text-sm font-medium">{f.value}</p></div></div>
            ))}
            <Button asChild variant="gold" className="w-full"><Link href={`/customize-trip?destination=${d.slug}`}>Plan my {d.name} trip</Link></Button>
          </div>
        </aside>
      </div>
    </>
  );
}
