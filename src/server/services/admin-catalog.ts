import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import type { DestinationInput, PackageInput } from "@/lib/validators/catalog";

async function uniqueSlug(model: "destination" | "tourPackage", base: string, ignoreId?: string) {
  const slug = slugify(base) || "item";
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? slug : `${slug}-${i}`;
    const found = model === "destination" ? await db.destination.findUnique({ where: { slug: candidate } }) : await db.tourPackage.findUnique({ where: { slug: candidate } });
    if (!found || found.id === ignoreId) return candidate;
  }
}

export async function saveDestination(actorId: string, d: DestinationInput, id?: string) {
  const { images, slug, ...rest } = d;
  if (rest.budgetMin != null && rest.budgetMax != null && rest.budgetMin > rest.budgetMax) throw new ApiError(422, "Minimum budget cannot exceed maximum budget");
  const finalSlug = await uniqueSlug("destination", slug ?? d.name, id);
  const data = { ...rest, slug: finalSlug };
  const row = await db.$transaction(async (tx) => {
    const r = id ? await tx.destination.update({ where: { id }, data }) : await tx.destination.create({ data });
    await tx.destinationImage.deleteMany({ where: { destinationId: r.id } });
    if (images.length) await tx.destinationImage.createMany({ data: images.map((url, i) => ({ destinationId: r.id, url, sortOrder: i, alt: `${r.name} photo ${i + 1}` })) });
    return r;
  });
  await audit(actorId, id ? "DESTINATION_UPDATE" : "DESTINATION_CREATE", "Destination", row.id);
  return row;
}

export async function deleteDestination(actorId: string, id: string) {
  const live = await db.tourPackage.count({ where: { destinationId: id, deletedAt: null } });
  if (live > 0) throw new ApiError(409, `This destination still has ${live} package(s). Delete or move them first.`);
  const row = await db.destination.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
  await audit(actorId, "DESTINATION_DELETE", "Destination", id);
  return row;
}

export async function savePackage(actorId: string, d: PackageInput, id?: string) {
  const { images, itinerary, inclusions, exclusions, slug, destinationId, ...rest } = d;
  const dest = await db.destination.findFirst({ where: { id: destinationId, deletedAt: null }, select: { id: true } });
  if (!dest) throw new ApiError(422, "Selected destination does not exist");
  const finalSlug = await uniqueSlug("tourPackage", slug ?? d.name, id);
  const data: Prisma.TourPackageUncheckedCreateInput = { ...rest, slug: finalSlug, destinationId };
  const row = await db.$transaction(async (tx) => {
    const r = id ? await tx.tourPackage.update({ where: { id }, data }) : await tx.tourPackage.create({ data });
    await Promise.all([
      tx.packageImage.deleteMany({ where: { packageId: r.id } }), tx.packageItinerary.deleteMany({ where: { packageId: r.id } }),
      tx.packageInclusion.deleteMany({ where: { packageId: r.id } }), tx.packageExclusion.deleteMany({ where: { packageId: r.id } }),
    ]);
    await tx.packageImage.createMany({ data: images.map((url, i) => ({ packageId: r.id, url, sortOrder: i, alt: `${r.name} ${i + 1}` })) });
    await tx.packageItinerary.createMany({ data: itinerary.map((x, i) => ({ packageId: r.id, dayNumber: i + 1, title: x.title, description: x.description, meals: x.meals, stay: x.stay ?? null })) });
    await tx.packageInclusion.createMany({ data: inclusions.map((text, i) => ({ packageId: r.id, text, sortOrder: i })) });
    await tx.packageExclusion.createMany({ data: exclusions.map((text, i) => ({ packageId: r.id, text, sortOrder: i })) });
    return r;
  });
  await audit(actorId, id ? "PACKAGE_UPDATE" : "PACKAGE_CREATE", "TourPackage", row.id);
  return row;
}

export async function deletePackage(actorId: string, id: string) {
  const row = await db.tourPackage.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
  await audit(actorId, "PACKAGE_DELETE", "TourPackage", id);
  return row;
}
