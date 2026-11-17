import { z } from "zod";

const url = z.string().trim().min(1).max(500).refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Must be an https URL or uploaded path");
const lines = z.array(z.string().trim().min(1).max(300)).max(60);

export const destinationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens").max(80).optional(),
  state: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).optional().nullable(),
  tagline: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().min(20).max(6000),
  coverImage: url,
  images: z.array(url).max(20).default([]),
  attractions: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  bestTimeToVisit: z.string().trim().max(200).optional().nullable(),
  howToReach: z.string().trim().max(1500).optional().nullable(),
  budgetMin: z.number().int().min(0).optional().nullable(),
  budgetMax: z.number().int().min(0).optional().nullable(),
  recommendedDays: z.string().trim().max(40).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});
export type DestinationInput = z.infer<typeof destinationSchema>;

export const packageSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(120).optional(),
    summary: z.string().trim().min(10).max(500),
    destinationId: z.string().min(1),
    coverImage: url,
    images: z.array(url).max(20).default([]),
    durationDays: z.number().int().min(1).max(60),
    durationNights: z.number().int().min(0).max(60),
    price: z.number().int().min(1),
    discountedPrice: z.number().int().min(1).optional().nullable(),
    tier: z.enum(["BUDGET", "PREMIUM", "LUXURY"]),
    hotelCategory: z.enum(["BUDGET", "STANDARD", "DELUXE", "LUXURY"]),
    travelTypes: z.array(z.enum(["FAMILY", "COUPLE", "GROUP", "SOLO"])).default([]),
    themes: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    departureCities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
    hotelInfo: z.string().trim().max(500).optional().nullable(),
    transportInfo: z.string().trim().max(500).optional().nullable(),
    activities: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    importantInfo: z.string().trim().max(2000).optional().nullable(),
    cancellationPolicy: z.string().trim().max(2000).optional().nullable(),
    maxGroupSize: z.number().int().min(1).max(500).optional().nullable(),
    isAvailable: z.boolean().default(true),
    isPublished: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    itinerary: z.array(z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().min(2).max(1500), meals: z.array(z.enum(["BREAKFAST", "LUNCH", "DINNER"])).default([]), stay: z.string().trim().max(120).optional().nullable() })).max(60).default([]),
    inclusions: lines.default([]),
    exclusions: lines.default([]),
  })
  .refine((d) => d.discountedPrice == null || d.discountedPrice < d.price, { message: "Discounted price must be lower than the price", path: ["discountedPrice"] });
export type PackageInput = z.infer<typeof packageSchema>;

export const categorySchema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(200).optional().nullable(), sortOrder: z.number().int().min(0).max(999).default(0) });

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3–30 letters, numbers, - or _"),
    description: z.string().trim().max(200).optional().nullable(),
    discountType: z.enum(["PERCENT", "FLAT"]),
    value: z.number().int().min(1),
    minAmount: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().min(1).optional().nullable(),
    usageLimit: z.number().int().min(1).optional().nullable(),
    validFrom: z.coerce.date().optional().nullable(),
    validUntil: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
    showOnHome: z.boolean().default(false),
  })
  .refine((d) => d.discountType !== "PERCENT" || d.value <= 100, { message: "Percent discount cannot exceed 100", path: ["value"] });

export const blogSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(150).optional(),
  excerpt: z.string().trim().min(10).max(300),
  content: z.string().trim().min(20).max(50000),
  coverImage: url,
  categoryName: z.string().trim().max(60).optional().nullable(),
  destinationId: z.string().min(1).optional().nullable(),
  seoTitle: z.string().trim().max(120).optional().nullable(),
  seoDescription: z.string().trim().max(200).optional().nullable(),
  isPublished: z.boolean().default(false),
});
