import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { PackageForm } from "@/components/admin/package-form";

export const metadata = { title: "Edit package" };
export const dynamic = "force-dynamic";

export default async function EditPackage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser({ permission: "package:manage" });
  const [p, destinations] = await Promise.all([
    db.tourPackage.findFirst({ where: { id: (await params).id, deletedAt: null }, include: { images: { orderBy: { sortOrder: "asc" } }, itinerary: { orderBy: { dayNumber: "asc" } }, inclusions: { orderBy: { sortOrder: "asc" } }, exclusions: { orderBy: { sortOrder: "asc" } } } }),
    db.destination.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!p) notFound();
  const s = (v: string | number | null) => (v == null ? "" : String(v));
  return (
    <div className="space-y-6"><h1 className="text-3xl">Edit {p.name}</h1>
      <PackageForm destinations={destinations} initial={{ id: p.id, name: p.name, slug: p.slug, summary: p.summary, destinationId: p.destinationId, coverImage: p.coverImage, images: p.images.map((i) => i.url), durationDays: p.durationDays, durationNights: p.durationNights, price: p.price, discountedPrice: s(p.discountedPrice), tier: p.tier, hotelCategory: p.hotelCategory, travelTypes: p.travelTypes, themes: p.themes.join(", "), departureCities: p.departureCities.join(", "), hotelInfo: s(p.hotelInfo), transportInfo: s(p.transportInfo), activities: p.activities.join("\n"), importantInfo: s(p.importantInfo), cancellationPolicy: s(p.cancellationPolicy), maxGroupSize: s(p.maxGroupSize), isAvailable: p.isAvailable, isPublished: p.isPublished, isFeatured: p.isFeatured, itinerary: p.itinerary.map((d) => ({ title: d.title, description: d.description, meals: d.meals, stay: s(d.stay) })), inclusions: p.inclusions.map((i) => i.text).join("\n"), exclusions: p.exclusions.map((i) => i.text).join("\n") }} /></div>
  );
}
