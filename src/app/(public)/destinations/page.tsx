import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { DestinationCard } from "@/components/site/cards";
import { destinationFilterOptions, listDestinations } from "@/server/services/catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Destinations", description: "Explore hill stations, beaches, heritage cities, pilgrimage towns and more across India." };
export const dynamic = "force-dynamic";

type SP = { q?: string; state?: string; category?: string; sort?: string; page?: string };

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [{ states, categories }, result] = await Promise.all([
    destinationFilterOptions(),
    listDestinations({ q: sp.q, state: sp.state, category: sp.category, sort: sp.sort, page: Number(sp.page) || 1 }),
  ]);
  const chip = (active: boolean) => cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition", active ? "border-navy bg-navy text-white" : "border-navy-200 bg-white hover:border-navy");
  const catHref = (slug?: string) => { const q = new URLSearchParams(); if (sp.q) q.set("q", sp.q); if (sp.state) q.set("state", sp.state); if (slug) q.set("category", slug); return `/destinations?${q}`; };

  return (
    <div className="container py-12">
      <p className="eyebrow">Destinations</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Find your next getaway</h1>

      <form method="get" className="mt-8 grid gap-3 rounded-2xl bg-white p-3 shadow-card md:grid-cols-[2fr_1fr_1fr_auto]">
        <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-navy-300" /><Input name="q" defaultValue={sp.q} placeholder="Search destinations, cities or states" className="pl-9" aria-label="Search destinations" /></div>
        <Select name="state" defaultValue={sp.state ?? ""} aria-label="Filter by state"><option value="">All states</option>{states.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select name="sort" defaultValue={sp.sort ?? "popular"} aria-label="Sort"><option value="popular">Most popular</option><option value="name">Name A–Z</option><option value="newest">Newest</option></Select>
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <Button type="submit">Apply</Button>
      </form>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2" role="navigation" aria-label="Categories">
        <Link href={catHref()} className={chip(!sp.category)}>All</Link>
        {categories.map((c) => <Link key={c.id} href={catHref(c.slug)} className={chip(sp.category === c.slug)}>{c.name}</Link>)}
      </div>

      <p className="mt-6 text-sm text-navy-400">{result.total} destination{result.total === 1 ? "" : "s"}</p>
      {result.items.length === 0 ? (
        <div className="mt-6"><EmptyState title="No destinations match your filters" description="Try clearing the search or choosing a different category." action={<Button asChild variant="outline"><Link href="/destinations">Reset filters</Link></Button>} /></div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{result.items.map((d) => <DestinationCard key={d.id} d={d} />)}</div>
      )}
      <Pagination page={result.page} totalPages={result.totalPages} basePath="/destinations" params={sp} />
    </div>
  );
}
