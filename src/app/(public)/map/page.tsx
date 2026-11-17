import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DATABASE_ENABLED } from "@/lib/config";
import { mockAllDestinations } from "@/server/mock/data";
import { IndiaMap } from "@/components/site/india-map";

export const metadata: Metadata = { title: "Explore India on the Map" };
export const dynamic = "force-dynamic";

const loadDests = () =>
  db.destination.findMany({
    where: { isPublished: true, deletedAt: null }, orderBy: { name: "asc" },
    select: { slug: true, name: true, state: true, packages: { where: { isPublished: true, deletedAt: null }, select: { slug: true, name: true, price: true, discountedPrice: true } } },
  });

export default async function MapPage() {
  const dests = !DATABASE_ENABLED
    ? (mockAllDestinations().sort((a, b) => a.name.localeCompare(b.name)) as unknown as Awaited<ReturnType<typeof loadDests>>)
    : await loadDests();
  return (
    <div className="container py-12">
      <p className="eyebrow">Interactive map</p><h1 className="mt-2 text-4xl md:text-5xl">Explore India by state</h1>
      <p className="mb-8 mt-3 max-w-xl text-navy-400">Tap a state to see its destinations and the tour packages available.</p>
      <IndiaMap mapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || undefined} destinations={dests.map((d) => ({ slug: d.slug, name: d.name, state: d.state, packages: d.packages.map((p) => ({ slug: p.slug, name: p.name, price: p.discountedPrice ?? p.price })) }))} />
    </div>
  );
}
