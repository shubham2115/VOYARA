import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { DATABASE_ENABLED } from "@/lib/config";
import * as mock from "@/server/mock/data";

const PAGE_SIZE = 12;

export type DestinationFilters = { q?: string; state?: string; category?: string; sort?: string; page?: number; pageSize?: number };

async function dbListDestinations(f: DestinationFilters) {
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

const dbDestinationFilterOptions = async () => {
  const [states, categories] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true, deletedAt: null }, select: { state: true }, distinct: ["state"], orderBy: { state: "asc" } }),
    db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { states: states.map((s) => s.state), categories };
};

const dbGetDestination = (slug: string) =>
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

async function dbListPackages(f: PackageFilters) {
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

const dbPackageFilterOptions = async () => {
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

const dbGetPackage = (slug: string) =>
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

const dbRelatedPackages = (packageId: string, destinationId: string, take = 3) =>
  db.tourPackage.findMany({
    where: { id: { not: packageId }, isPublished: true, deletedAt: null, destinationId },
    take, orderBy: { popularity: "desc" }, include: { destination: { select: { name: true, slug: true, state: true } } },
  });

export const getSetting = async <T>(key: string, fallback: T): Promise<T> => {
  if (!DATABASE_ENABLED) return mock.mockSetting(key, fallback);
  const s = await db.siteSetting.findUnique({ where: { key } });
  return (s?.value as T) ?? fallback;
};

/* ---- Public entry points: real Prisma queries, or static mock data when ENABLE_DATABASE=false ---- */
type R<F extends (...a: never[]) => unknown> = Awaited<ReturnType<F>>;

export const listDestinations = async (f: DestinationFilters): Promise<R<typeof dbListDestinations>> =>
  DATABASE_ENABLED ? dbListDestinations(f) : (mock.mockListDestinations(f, PAGE_SIZE) as unknown as R<typeof dbListDestinations>);
export const destinationFilterOptions = async (): Promise<R<typeof dbDestinationFilterOptions>> =>
  DATABASE_ENABLED ? dbDestinationFilterOptions() : (mock.mockDestinationFilterOptions() as unknown as R<typeof dbDestinationFilterOptions>);
export const getDestination = async (slug: string): Promise<R<typeof dbGetDestination>> =>
  DATABASE_ENABLED ? dbGetDestination(slug) : (mock.mockGetDestination(slug) as unknown as R<typeof dbGetDestination>);
export const listPackages = async (f: PackageFilters): Promise<R<typeof dbListPackages>> =>
  DATABASE_ENABLED ? dbListPackages(f) : (mock.mockListPackages(f, PAGE_SIZE) as unknown as R<typeof dbListPackages>);
export const packageFilterOptions = async (): Promise<R<typeof dbPackageFilterOptions>> =>
  DATABASE_ENABLED ? dbPackageFilterOptions() : mock.mockPackageFilterOptions();
export const getPackage = async (slug: string): Promise<R<typeof dbGetPackage>> =>
  DATABASE_ENABLED ? dbGetPackage(slug) : (mock.mockGetPackage(slug) as unknown as R<typeof dbGetPackage>);
export const relatedPackages = async (packageId: string, destinationId: string, take = 3): Promise<R<typeof dbRelatedPackages>> =>
  DATABASE_ENABLED ? dbRelatedPackages(packageId, destinationId, take) : (mock.mockRelatedPackages(packageId, destinationId, take) as unknown as R<typeof dbRelatedPackages>);

/** Home page data (single place so the page itself stays query-free). */
async function dbHomeData() {
  const live = { isPublished: true, deletedAt: null } as const;
  const [destinations, trending, luxury, categories, reviews, coupons, blogs, destOptions, pkgs] = await Promise.all([
    db.destination.findMany({ where: live, orderBy: { popularity: "desc" }, take: 8, include: { category: { select: { name: true } }, _count: { select: { packages: { where: live } } } } }),
    db.tourPackage.findMany({ where: { ...live, isAvailable: true }, orderBy: { popularity: "desc" }, take: 6, include: { destination: { select: { name: true, state: true } } } }),
    db.tourPackage.findMany({ where: { ...live, isAvailable: true, tier: { in: ["LUXURY", "PREMIUM"] }, isFeatured: true }, take: 3, include: { destination: { select: { name: true } } } }),
    db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { destinations: { where: live, take: 1, select: { coverImage: true } }, _count: { select: { destinations: true } } } }),
    db.review.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 3, include: { user: { select: { name: true } }, package: { select: { name: true } } } }),
    db.coupon.findMany({ where: { isActive: true, showOnHome: true, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] }, take: 3 }),
    db.blog.findMany({ where: { ...live, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 3, include: { category: true } }),
    db.destination.findMany({ where: live, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    db.tourPackage.findMany({ where: live, select: { departureCities: true } }),
  ]);
  return { destinations, trending, luxury, categories, reviews, coupons, blogs, destOptions, cities: [...new Set(pkgs.flatMap((p) => p.departureCities))].sort() };
}
function mockHomeData(): R<typeof dbHomeData> {
  const dests = mock.mockAllDestinations();
  const pkgs = mock.mockAllPackages().filter((p) => p.isAvailable);
  const home = {
    destinations: dests.sort((a, b) => b.popularity - a.popularity).slice(0, 8),
    trending: pkgs.sort((a, b) => b.popularity - a.popularity).slice(0, 6),
    luxury: pkgs.filter((p) => (p.tier === "LUXURY" || p.tier === "PREMIUM") && p.isFeatured).slice(0, 3),
    categories: mock.mockCategories.map((c) => ({
      ...c,
      destinations: dests.filter((d) => d.categoryId === c.id).slice(0, 1).map((d) => ({ coverImage: d.coverImage })),
      _count: { destinations: dests.filter((d) => d.categoryId === c.id).length },
    })),
    reviews: mock.mockReviewsList(3),
    coupons: mock.mockCoupons().slice(0, 3),
    blogs: mock.mockLatestBlogs(3),
    destOptions: dests.map((d) => ({ name: d.name, slug: d.slug })).sort((a, b) => a.name.localeCompare(b.name)),
    cities: mock.mockPackageFilterOptions().cities,
  };
  return home as unknown as R<typeof dbHomeData>;
}
export const getHomeData = async (): Promise<R<typeof dbHomeData>> => (DATABASE_ENABLED ? dbHomeData() : mockHomeData());

/** Names (and slugs) of published destinations, for form dropdowns. */
export const listDestinationOptions = async (): Promise<{ name: string; slug: string }[]> =>
  DATABASE_ENABLED
    ? db.destination.findMany({ where: { isPublished: true, deletedAt: null }, select: { name: true, slug: true }, orderBy: { name: "asc" } })
    : mock.mockPackageFilterOptions().destinations;
