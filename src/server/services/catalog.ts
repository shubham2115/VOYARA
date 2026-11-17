import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;

export type DestinationFilters = { q?: string; state?: string; category?: string; sort?: string; page?: number; pageSize?: number };

export async function listDestinations(f: DestinationFilters) {
  const where: Prisma.DestinationWhereInput = {
    isPublished: true,
    deletedAt: null,
    ...(f.q && { OR: [{ name: { contains: f.q, mode: "insensitive" } }, { state: { contains: f.q, mode: "insensitive" } }, { city: { contains: f.q, mode: "insensitive" } }] }),
    ...(f.state && { state: f.state }),
    ...(f.category && { category: { slug: f.category } }),
  };
  const orderBy: Prisma.DestinationOrderByWithRelationInput =
    f.sort === "name" ? { name: "asc" } : f.sort === "newest" ? { createdAt: "desc" } : { popularity: "desc" };
  const page = Math.max(1, f.page ?? 1);
  const size = f.pageSize ?? PAGE_SIZE;
  const [items, total] = await Promise.all([
    db.destination.findMany({
      where, orderBy, skip: (page - 1) * size, take: size,
      include: { category: { select: { name: true, slug: true } }, _count: { select: { packages: { where: { isPublished: true, deletedAt: null } } } } },
    }),
    db.destination.count({ where }),
  ]);
  return { items, total, page, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export const destinationFilterOptions = async () => {
  const [states, categories] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true, deletedAt: null }, select: { state: true }, distinct: ["state"], orderBy: { state: "asc" } }),
    db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { states: states.map((s) => s.state), categories };
};

export const getDestination = (slug: string) =>
  db.destination.findFirst({
    where: { slug, isPublished: true, deletedAt: null },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      nearby: { where: { isPublished: true, deletedAt: null }, select: { id: true, name: true, slug: true, coverImage: true, state: true, tagline: true } },
      packages: { where: { isPublished: true, deletedAt: null }, orderBy: { popularity: "desc" }, include: { destination: { select: { name: true, slug: true } } } },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } } } },
    },
  });

export type PackageFilters = {
  destination?: string; minPrice?: number; maxPrice?: number; minDays?: number; maxDays?: number; theme?: string; hotel?: string;
  tier?: string; travelType?: string; city?: string; q?: string; sort?: string; page?: number; pageSize?: number;
};

const effectivePrice = (p: { price: number; discountedPrice: number | null }) => p.discountedPrice ?? p.price;

export async function listPackages(f: PackageFilters) {
  const and: Prisma.TourPackageWhereInput[] = [];
  if (f.minPrice != null) and.push({ OR: [{ discountedPrice: { gte: f.minPrice } }, { discountedPrice: null, price: { gte: f.minPrice } }] });
  if (f.maxPrice != null) and.push({ OR: [{ discountedPrice: { lte: f.maxPrice } }, { discountedPrice: null, price: { lte: f.maxPrice } }] });
  const where: Prisma.TourPackageWhereInput = {
    isPublished: true, isAvailable: true, deletedAt: null,
    ...(f.destination && { destination: { slug: f.destination } }),
    ...(f.minDays != null || f.maxDays != null ? { durationDays: { ...(f.minDays != null && { gte: f.minDays }), ...(f.maxDays != null && { lte: f.maxDays }) } } : {}),
    ...(f.theme && { themes: { has: f.theme } }),
    ...(f.hotel && { hotelCategory: f.hotel as never }),
    ...(f.tier && { tier: f.tier as never }),
    ...(f.travelType && { travelTypes: { has: f.travelType as never } }),
    ...(f.city && { departureCities: { has: f.city } }),
    ...(f.q && { OR: [{ name: { contains: f.q, mode: "insensitive" } }, { destination: { name: { contains: f.q, mode: "insensitive" } } }] }),
    ...(and.length && { AND: and }),
  };
  const page = Math.max(1, f.page ?? 1);
  const size = f.pageSize ?? PAGE_SIZE;
  const base = { where, include: { destination: { select: { name: true, slug: true, state: true } } } } as const;

  // Price sorts use the effective (discounted-or-regular) price, so sort in memory over the filtered set.
  if (f.sort === "price_asc" || f.sort === "price_desc") {
    const all = await db.tourPackage.findMany(base);
    all.sort((a, b) => (f.sort === "price_asc" ? 1 : -1) * (effectivePrice(a) - effectivePrice(b)));
    return { items: all.slice((page - 1) * size, page * size), total: all.length, page, pageSize: size, totalPages: Math.max(1, Math.ceil(all.length / size)) };
  }
  const orderBy: Prisma.TourPackageOrderByWithRelationInput[] =
    f.sort === "rating" ? [{ ratingAvg: "desc" }, { ratingCount: "desc" }] : [{ popularity: "desc" }];
  const [items, total] = await Promise.all([
    db.tourPackage.findMany({ ...base, orderBy, skip: (page - 1) * size, take: size }),
    db.tourPackage.count({ where }),
  ]);
  return { items, total, page, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export const packageFilterOptions = async () => {
  const [destinations, pkgs] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true, deletedAt: null, packages: { some: { isPublished: true } } }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    db.tourPackage.findMany({ where: { isPublished: true, deletedAt: null }, select: { themes: true, departureCities: true } }),
  ]);
  return {
    destinations,
    themes: [...new Set(pkgs.flatMap((p) => p.themes))].sort(),
    cities: [...new Set(pkgs.flatMap((p) => p.departureCities))].sort(),
  };
};

export const getPackage = (slug: string) =>
  db.tourPackage.findFirst({
    where: { slug, isPublished: true, deletedAt: null },
    include: {
      destination: { select: { id: true, name: true, slug: true, state: true } },
      images: { orderBy: { sortOrder: "asc" } },
      itinerary: { orderBy: { dayNumber: "asc" } },
      inclusions: { orderBy: { sortOrder: "asc" } },
      exclusions: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } },
    },
  });

export const relatedPackages = (packageId: string, destinationId: string, take = 3) =>
  db.tourPackage.findMany({
    where: { id: { not: packageId }, isPublished: true, deletedAt: null, destinationId },
    take, orderBy: { popularity: "desc" }, include: { destination: { select: { name: true, slug: true, state: true } } },
  });

export const getSetting = async <T>(key: string, fallback: T): Promise<T> => {
  const s = await db.siteSetting.findUnique({ where: { key } });
  return (s?.value as T) ?? fallback;
};
