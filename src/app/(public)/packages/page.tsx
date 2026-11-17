import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { PackageCard } from "@/components/site/cards";
import { listPackages, packageFilterOptions } from "@/server/services/catalog";
import { currentWishlistIds } from "@/server/services/wishlist";

export const metadata: Metadata = { title: "Tour Packages", description: "Browse curated India tour packages by destination, budget, duration and travel style." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;
const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

const DURATIONS = [["", "Any duration"], ["1-3", "1–3 days"], ["4-5", "4–5 days"], ["6-7", "6–7 days"], ["8-30", "8+ days"]];

export default async function PackagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [minDays, maxDays] = (sp.duration ?? "").split("-").map(num);
  const [opts, result, wished] = await Promise.all([
    packageFilterOptions(),
    listPackages({ destination: sp.destination, minPrice: num(sp.minPrice), maxPrice: num(sp.maxPrice), minDays, maxDays, theme: sp.theme, hotel: sp.hotel, tier: sp.tier, travelType: sp.type, city: sp.city, q: sp.q, sort: sp.sort, page: Number(sp.page) || 1 }),
    currentWishlistIds(),
  ]);

  return (
    <div className="container py-12">
      <p className="eyebrow">Tour packages</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Journeys made for you</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <form method="get" className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <Input name="q" defaultValue={sp.q} placeholder="Search packages" aria-label="Search packages" />
          <Select name="destination" defaultValue={sp.destination ?? ""} aria-label="Destination"><option value="">All destinations</option>{opts.destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</Select>
          <div className="grid grid-cols-2 gap-2"><Input name="minPrice" type="number" min={0} defaultValue={sp.minPrice} placeholder="Min ₹" aria-label="Minimum price" /><Input name="maxPrice" type="number" min={0} defaultValue={sp.maxPrice} placeholder="Max ₹" aria-label="Maximum price" /></div>
          <Select name="duration" defaultValue={sp.duration ?? ""} aria-label="Duration">{DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
          <Select name="theme" defaultValue={sp.theme ?? ""} aria-label="Travel category"><option value="">All categories</option>{opts.themes.map((t) => <option key={t}>{t}</option>)}</Select>
          <Select name="hotel" defaultValue={sp.hotel ?? ""} aria-label="Hotel category"><option value="">Any hotel category</option>{["BUDGET", "STANDARD", "DELUXE", "LUXURY"].map((h) => <option key={h} value={h}>{h[0] + h.slice(1).toLowerCase()}</option>)}</Select>
          <Select name="tier" defaultValue={sp.tier ?? ""} aria-label="Budget or luxury"><option value="">Budget / Luxury</option><option value="BUDGET">Budget</option><option value="PREMIUM">Premium</option><option value="LUXURY">Luxury</option></Select>
          <Select name="type" defaultValue={sp.type ?? ""} aria-label="Travel type"><option value="">Family / Couple / Group</option><option value="FAMILY">Family</option><option value="COUPLE">Couple</option><option value="GROUP">Group</option><option value="SOLO">Solo</option></Select>
          <Select name="city" defaultValue={sp.city ?? ""} aria-label="Departure city"><option value="">Any departure city</option>{opts.cities.map((c) => <option key={c}>{c}</option>)}</Select>
          <Select name="sort" defaultValue={sp.sort ?? "popular"} aria-label="Sort by"><option value="popular">Most popular</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Highest rated</option></Select>
          <div className="flex gap-2"><Button type="submit" className="flex-1">Apply filters</Button><Button asChild variant="outline"><Link href="/packages">Reset</Link></Button></div>
        </form>

        <div>
          <p className="mb-4 text-sm text-navy-400">{result.total} package{result.total === 1 ? "" : "s"} found</p>
          {result.items.length === 0 ? (
            <EmptyState title="No packages match your filters" description="Loosen a filter, or tell us what you want and we'll build it for you." action={<Button asChild variant="gold"><Link href="/customize-trip">Customize a trip</Link></Button>} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{result.items.map((p) => <PackageCard key={p.id} p={p} wished={wished.has(p.id)} />)}</div>
          )}
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/packages" params={sp} />
        </div>
      </div>
    </div>
  );
}
