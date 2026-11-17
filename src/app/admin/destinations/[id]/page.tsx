import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { DestinationForm } from "@/components/admin/destination-form";

export const metadata = { title: "Edit destination" };
export const dynamic = "force-dynamic";

export default async function EditDestination({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser({ permission: "destination:manage" });
  const [d, categories] = await Promise.all([
    db.destination.findFirst({ where: { id: (await params).id, deletedAt: null }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!d) notFound();
  const s = (v: string | number | null) => (v == null ? "" : String(v));
  return (
    <div className="space-y-6"><h1 className="text-3xl">Edit {d.name}</h1>
      <DestinationForm categories={categories} initial={{ id: d.id, name: d.name, slug: d.slug, state: d.state, city: s(d.city), tagline: s(d.tagline), description: d.description, coverImage: d.coverImage, images: d.images.map((i) => i.url), attractions: d.attractions.join("\n"), bestTimeToVisit: s(d.bestTimeToVisit), howToReach: s(d.howToReach), budgetMin: s(d.budgetMin), budgetMax: s(d.budgetMax), recommendedDays: s(d.recommendedDays), latitude: s(d.latitude), longitude: s(d.longitude), categoryId: s(d.categoryId), isPublished: d.isPublished, isFeatured: d.isFeatured }} /></div>
  );
}
