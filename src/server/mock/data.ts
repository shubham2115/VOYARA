/**
 * Mock/static catalogue used when ENABLE_DATABASE=false (frontend-only deployment).
 * Derived from the development seed data so the UI looks identical to a seeded database.
 * Objects carry every scalar column of the corresponding Prisma model.
 */
import { destinations as seedDestinations } from "../../../prisma/seed-data/destinations";
import { packages as seedPackages } from "../../../prisma/seed-data/packages";
import { blogs as seedBlogs, categories as seedCategories, coupons as seedCoupons, settings as seedSettings, testimonials } from "../../../prisma/seed-data/content";
import { slugify } from "@/lib/utils";

const img = (seed: string, w = 1600, h = 1000) => `https://picsum.photos/seed/${slugify(seed)}/${w}/${h}`;
const T0 = new Date("2026-01-01T00:00:00Z");

export const mockCategories = seedCategories.map(([name, description], i) => ({
  id: `cat-${i + 1}`, name, slug: slugify(name), description, icon: null, sortOrder: i, createdAt: T0, updatedAt: T0,
}));
const catByName = Object.fromEntries(mockCategories.map((c) => [c.name, c]));

const baseDestinations = seedDestinations.map((d, i) => {
  const slug = slugify(d.name);
  return {
    id: `dest-${slug}`, name: d.name, slug, state: d.state, city: d.city, tagline: d.tagline, description: d.description,
    coverImage: img(slug), attractions: d.attractions, bestTimeToVisit: d.best, howToReach: d.reach,
    budgetMin: d.budget[0], budgetMax: d.budget[1], recommendedDays: d.days, latitude: d.lat, longitude: d.lng,
    popularity: d.popularity, isPublished: true, isFeatured: !!d.featured, deletedAt: null as Date | null,
    createdAt: new Date(T0.getTime() + i * 86400_000), updatedAt: T0, categoryId: catByName[d.category]?.id ?? null,
    _nearbyNames: d.nearby,
  };
});
const destBySlug = Object.fromEntries(baseDestinations.map((d) => [d.slug, d]));
const destByName = Object.fromEntries(baseDestinations.map((d) => [d.name, d]));

const basePackages = seedPackages.map((p, i) => {
  const slug = slugify(p.name);
  const dest = destByName[p.destination];
  return {
    id: `pkg-${slug}`, name: p.name, slug, summary: p.summary, destinationId: dest.id, coverImage: img(`pkg-${slug}`),
    durationDays: p.days, durationNights: p.days - 1, price: p.price, discountedPrice: p.discounted ?? null,
    tier: p.tier, hotelCategory: p.hotel, travelTypes: p.types, themes: p.themes, departureCities: p.cities,
    hotelInfo: p.stay, transportInfo: p.transport, activities: p.activities,
    importantInfo: "Carry a valid government photo ID. Itinerary order may change due to weather or local conditions. Entry tickets are payable locally unless stated.",
    cancellationPolicy: "Free cancellation up to 15 days before departure. 50% refund 8–14 days before. No refund within 7 days of departure.",
    maxGroupSize: 20, isAvailable: true, isPublished: true, isFeatured: !!p.featured, popularity: p.popularity,
    ratingAvg: 0, ratingCount: 0, deletedAt: null as Date | null, createdAt: new Date(T0.getTime() + i * 86400_000), updatedAt: T0,
    _dest: dest, _p: p,
  };
});

const destRef = (d: (typeof baseDestinations)[number]) => ({ id: d.id, name: d.name, slug: d.slug, state: d.state });

const mockReviews = testimonials.map((t, i) => ({
  id: `rev-${i + 1}`, userId: `user-${i + 1}`, bookingId: null, packageId: basePackages[i % basePackages.length].id, destinationId: null,
  rating: t.rating, title: t.title, body: t.body, status: "APPROVED" as const, createdAt: new Date(T0.getTime() + i * 86400_000), updatedAt: T0,
  user: { name: t.name },
}));

/** Package with full relations (as returned by getPackage / listPackages includes). */
function fullPackage(b: (typeof basePackages)[number]) {
  const { _dest, _p, ...p } = b;
  return {
    ...p,
    destination: destRef(_dest),
    images: [1, 2, 3].map((n) => ({ id: `${b.id}-img-${n}`, packageId: b.id, url: img(`pkg-${b.slug}-${n}`, 1200, 800), alt: `${b.name} ${n}`, sortOrder: n })),
    itinerary: _p.itinerary.map(([title, description], i) => ({
      id: `${b.id}-day-${i + 1}`, packageId: b.id, dayNumber: i + 1, title, description,
      meals: i === 0 ? ["DINNER"] : ["BREAKFAST", "DINNER"], stay: i === _p.itinerary.length - 1 ? null : _p.stay.split(" in ")[0],
    })),
    inclusions: [`${_p.days - 1} nights accommodation (${_p.stay})`, "Daily breakfast and dinner", _p.transport, "All sightseeing as per itinerary", "Driver allowance, tolls and parking", "24×7 on-trip support"]
      .map((text, i) => ({ id: `${b.id}-inc-${i}`, packageId: b.id, text, sortOrder: i })),
    exclusions: ["Airfare / train fare to the starting point", "Lunch and personal expenses", "Monument entry fees and optional activities", "Travel insurance", "GST as applicable"]
      .map((text, i) => ({ id: `${b.id}-exc-${i}`, packageId: b.id, text, sortOrder: i })),
    reviews: mockReviews.filter((r) => r.packageId === b.id),
  };
}

function fullDestination(d: (typeof baseDestinations)[number]) {
  const { _nearbyNames, ...dest } = d;
  const pkgs = basePackages.filter((p) => p.destinationId === d.id).sort((a, b) => b.popularity - a.popularity);
  return {
    ...dest,
    category: d.categoryId ? mockCategories.find((c) => c.id === d.categoryId)! : null,
    images: [1, 2, 3, 4].map((n) => ({ id: `${d.id}-img-${n}`, destinationId: d.id, url: img(`${d.slug}-${n}`, 1200, 800), alt: `${d.name} view ${n}`, sortOrder: n })),
    nearby: _nearbyNames.map((n) => destByName[n]).filter(Boolean)
      .map((n) => ({ id: n.id, name: n.name, slug: n.slug, coverImage: n.coverImage, state: n.state, tagline: n.tagline })),
    packages: pkgs.map((p) => ({ ...p, destination: { name: d.name, slug: d.slug } })),
    reviews: [] as typeof mockReviews,
    _count: { packages: pkgs.length },
  };
}

export const mockAllDestinations = () => baseDestinations.map(fullDestination);
export const mockAllPackages = () => basePackages.map(fullPackage);
const includes = (s: string | null | undefined, q: string) => !!s && s.toLowerCase().includes(q.toLowerCase());

/* ---------- catalog-equivalent helpers ---------- */

export function mockListDestinations(f: { q?: string; state?: string; category?: string; sort?: string; page?: number; pageSize?: number }, defaultSize: number) {
  let items = mockAllDestinations().filter((d) =>
    (!f.q || includes(d.name, f.q) || includes(d.state, f.q) || includes(d.city, f.q)) &&
    (!f.state || d.state === f.state) && (!f.category || d.category?.slug === f.category));
  items = items.sort((a, b) => f.sort === "name" ? a.name.localeCompare(b.name) : f.sort === "newest" ? +b.createdAt - +a.createdAt : b.popularity - a.popularity);
  const page = Math.max(1, f.page ?? 1), size = f.pageSize ?? defaultSize;
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, pageSize: size, totalPages: Math.max(1, Math.ceil(items.length / size)) };
}

export const mockDestinationFilterOptions = () => ({
  states: [...new Set(baseDestinations.map((d) => d.state))].sort(),
  categories: mockCategories,
});

export const mockGetDestination = (slug: string) => (destBySlug[slug] ? fullDestination(destBySlug[slug]) : null);

export function mockListPackages(
  f: { destination?: string; minPrice?: number; maxPrice?: number; minDays?: number; maxDays?: number; theme?: string; hotel?: string; tier?: string; travelType?: string; city?: string; q?: string; sort?: string; page?: number; pageSize?: number },
  defaultSize: number,
) {
  const eff = (p: { price: number; discountedPrice: number | null }) => p.discountedPrice ?? p.price;
  let items = mockAllPackages().filter((p) =>
    (!f.destination || p.destination.slug === f.destination) &&
    (f.minPrice == null || eff(p) >= f.minPrice) && (f.maxPrice == null || eff(p) <= f.maxPrice) &&
    (f.minDays == null || p.durationDays >= f.minDays) && (f.maxDays == null || p.durationDays <= f.maxDays) &&
    (!f.theme || p.themes.includes(f.theme)) && (!f.hotel || p.hotelCategory === f.hotel) && (!f.tier || p.tier === f.tier) &&
    (!f.travelType || (p.travelTypes as string[]).includes(f.travelType)) && (!f.city || p.departureCities.includes(f.city)) &&
    (!f.q || includes(p.name, f.q) || includes(p.destination.name, f.q)));
  items = items.sort((a, b) =>
    f.sort === "price_asc" ? eff(a) - eff(b) : f.sort === "price_desc" ? eff(b) - eff(a)
    : f.sort === "rating" ? b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount : b.popularity - a.popularity);
  const page = Math.max(1, f.page ?? 1), size = f.pageSize ?? defaultSize;
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, pageSize: size, totalPages: Math.max(1, Math.ceil(items.length / size)) };
}

export const mockPackageFilterOptions = () => ({
  destinations: baseDestinations.filter((d) => basePackages.some((p) => p.destinationId === d.id)).map((d) => ({ name: d.name, slug: d.slug })).sort((a, b) => a.name.localeCompare(b.name)),
  themes: [...new Set(basePackages.flatMap((p) => p.themes))].sort(),
  cities: [...new Set(basePackages.flatMap((p) => p.departureCities))].sort(),
});

export const mockGetPackage = (slug: string) => { const b = basePackages.find((p) => p.slug === slug); return b ? fullPackage(b) : null; };
export const mockRelatedPackages = (packageId: string, destinationId: string, take: number) =>
  mockAllPackages().filter((p) => p.id !== packageId && p.destinationId === destinationId).sort((a, b) => b.popularity - a.popularity).slice(0, take);

export const mockSetting = <T,>(key: string, fallback: T): T => (key in seedSettings ? (seedSettings[key] as T) : fallback);

/* ---------- blog / misc ---------- */

const blogCats = [...new Set(seedBlogs.map((b) => b.category))].map((name, i) => ({ id: `bcat-${i + 1}`, name, slug: slugify(name) }));
const allBlogs = () =>
  seedBlogs.map((b, i) => {
    const slug = slugify(b.title);
    const dest = destByName[b.destination];
    const category = blogCats.find((c) => c.name === b.category)!;
    return {
      id: `blog-${slug}`, title: b.title, slug, excerpt: b.excerpt, content: b.content, coverImage: img(`blog-${slug}`, 1400, 800),
      categoryId: category.id, destinationId: dest?.id ?? null, authorId: null,
      seoTitle: null as string | null, seoDescription: null as string | null, isPublished: true,
      publishedAt: new Date(T0.getTime() - i * 7 * 86400_000) as Date | null, deletedAt: null as Date | null, createdAt: T0, updatedAt: T0,
      category, destination: dest ? { name: dest.name, slug: dest.slug } : null,
    };
  }).sort((a, b) => +b.publishedAt! - +a.publishedAt!);

export const mockBlogCategories = () => [...blogCats].sort((a, b) => a.name.localeCompare(b.name));
export const mockListBlogs = (category: string | undefined, page: number, size: number) => {
  const all = allBlogs().filter((b) => !category || b.category.slug === category);
  return { posts: all.slice((page - 1) * size, page * size), total: all.length };
};
export const mockGetBlog = (slug: string) => allBlogs().find((b) => b.slug === slug) ?? null;
export const mockLatestBlogs = (n: number) => allBlogs().slice(0, n);
export const mockReviewsList = (n: number) =>
  mockReviews.slice(0, n).map((r) => ({ ...r, package: { name: basePackages.find((p) => p.id === r.packageId)!.name } }));
export const mockCoupons = () =>
  seedCoupons.map((c, i) => ({ id: `coupon-${i + 1}`, ...c, usageLimit: null, usedCount: 0, validFrom: null, validUntil: new Date(Date.now() + 180 * 86400_000) as Date | null, isActive: true, createdAt: T0, updatedAt: T0 }));
