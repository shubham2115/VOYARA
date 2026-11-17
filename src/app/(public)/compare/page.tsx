import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { DATABASE_ENABLED } from "@/lib/config";
import { mockAllPackages } from "@/server/mock/data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { formatINR, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Compare Packages" };
export const dynamic = "force-dynamic";

const loadPackages = (slugs: string[]) =>
  db.tourPackage.findMany({ where: { slug: { in: slugs }, isPublished: true, deletedAt: null }, include: { destination: { select: { name: true } }, inclusions: true, exclusions: true } });

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ slugs?: string }> }) {
  const slugs = [...new Set((await searchParams).slugs?.split(",").map((s) => s.trim()).filter(Boolean) ?? [])].slice(0, 3);
  const pkgs = !slugs.length ? [] : !DATABASE_ENABLED ? (mockAllPackages().filter((p) => slugs.includes(p.slug)) as unknown as Awaited<ReturnType<typeof loadPackages>>) : await loadPackages(slugs);
  const ordered = slugs.map((s) => pkgs.find((p) => p.slug === s)).filter((p): p is (typeof pkgs)[number] => !!p);
  if (ordered.length < 2)
    return <div className="container py-14"><h1 className="mb-6 text-4xl">Compare packages</h1><EmptyState title="Pick at least two packages" description="Use the Compare button on package cards (up to three), then open the comparison." action={<Button asChild variant="gold"><Link href="/packages">Browse packages</Link></Button>} /></div>;

  const rows: [string, (p: (typeof ordered)[number]) => React.ReactNode][] = [
    ["Destination", (p) => p.destination.name], ["Duration", (p) => `${p.durationNights}N / ${p.durationDays}D`],
    ["Price / person", (p) => <b>{formatINR(p.discountedPrice ?? p.price)}</b>], ["Hotel category", (p) => humanize(p.hotelCategory)], ["Tier", (p) => humanize(p.tier)],
    ["Best for", (p) => p.travelTypes.map(humanize).join(", ") || "—"], ["Stay", (p) => p.hotelInfo ?? "—"], ["Transport", (p) => p.transportInfo ?? "—"],
    ["Rating", (p) => (p.ratingCount ? `${p.ratingAvg.toFixed(1)} (${p.ratingCount})` : "No reviews")], ["Inclusions", (p) => p.inclusions.length], ["Activities", (p) => p.activities.join(", ") || "—"],
  ];
  return (
    <div className="container py-12">
      <h1 className="mb-8 text-4xl">Compare packages</h1>
      <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr><th className="w-40 p-4" />{ordered.map((p) => <th key={p.id} className="p-4 align-top"><div className="relative mb-2 aspect-[16/10] overflow-hidden rounded-xl"><Image src={p.coverImage} alt={p.name} fill sizes="33vw" className="object-cover" /></div><Link href={`/packages/${p.slug}`} className="font-serif text-lg hover:text-gold-600">{p.name}</Link></th>)}</tr></thead>
        <tbody className="divide-y divide-navy-50">{rows.map(([label, fn]) => <tr key={label}><th scope="row" className="p-4 font-medium text-navy-400">{label}</th>{ordered.map((p) => <td key={p.id} className="p-4">{fn(p)}</td>)}</tr>)}
          <tr><th className="p-4" />{ordered.map((p) => <td key={p.id} className="p-4"><Button asChild size="sm" variant="gold"><Link href={`/packages/${p.slug}#book`}>Book this</Link></Button></td>)}</tr></tbody></table></div>
    </div>
  );
}
