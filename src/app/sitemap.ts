import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { DATABASE_ENABLED } from "@/lib/config";
import { mockAllDestinations, mockAllPackages, mockLatestBlogs } from "@/server/mock/data";

export const dynamic = "force-dynamic";
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const live = { isPublished: true, deletedAt: null } as const;
  const [d, p, b] = !DATABASE_ENABLED
    ? [mockAllDestinations(), mockAllPackages(), mockLatestBlogs(100)]
    : await Promise.all([
    db.destination.findMany({ where: live, select: { slug: true, updatedAt: true } }),
    db.tourPackage.findMany({ where: live, select: { slug: true, updatedAt: true } }),
    db.blog.findMany({ where: live, select: { slug: true, updatedAt: true } }),
  ]);
  const statics = ["", "/destinations", "/packages", "/customize-trip", "/blog", "/about", "/contact", "/faq", "/map", "/ai-planner", "/privacy-policy", "/terms", "/cancellation-refund-policy"];
  return [
    ...statics.map((s) => ({ url: `${base}${s}`, changeFrequency: "weekly" as const, priority: s === "" ? 1 : 0.7 })),
    ...d.map((x) => ({ url: `${base}/destinations/${x.slug}`, lastModified: x.updatedAt, priority: 0.8 })),
    ...p.map((x) => ({ url: `${base}/packages/${x.slug}`, lastModified: x.updatedAt, priority: 0.8 })),
    ...b.map((x) => ({ url: `${base}/blog/${x.slug}`, lastModified: x.updatedAt, priority: 0.6 })),
  ];
}
