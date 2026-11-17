import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import type { blogSchema } from "@/lib/validators/catalog";

export async function saveBlog(actorId: string, d: z.infer<typeof blogSchema>, id?: string) {
  const { categoryName, slug, ...rest } = d;
  const category = categoryName ? await db.blogCategory.upsert({ where: { slug: slugify(categoryName) }, update: {}, create: { name: categoryName, slug: slugify(categoryName) } }) : null;
  let finalSlug = slug ?? slugify(d.title);
  for (let i = 2; ; i++) {
    const clash = await db.blog.findUnique({ where: { slug: finalSlug } });
    if (!clash || clash.id === id) break;
    finalSlug = `${slugify(d.title)}-${i}`;
  }
  const existing = id ? await db.blog.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
  const data = { ...rest, slug: finalSlug, categoryId: category?.id ?? null, authorId: actorId, publishedAt: d.isPublished ? (existing?.publishedAt ?? new Date()) : null };
  const row = id ? await db.blog.update({ where: { id }, data }) : await db.blog.create({ data });
  await audit(actorId, id ? "BLOG_UPDATE" : "BLOG_CREATE", "Blog", row.id);
  return row;
}

/** Whitelisted CMS keys and their validators; anything else is rejected. */
export const cmsSchemas = {
  "site.hero": z.object({ heading: z.string().trim().min(3).max(120), subtitle: z.string().trim().max(300) }),
  "site.contact": z.object({ phone: z.string().trim().max(30), email: z.string().trim().email().or(z.literal("")), address: z.string().trim().max(200), whatsapp: z.string().trim().regex(/^\d{10,15}$/, "Digits only, with country code").or(z.literal("")) }),
  "site.about": z.object({ story: z.string().trim().min(10).max(3000) }),
  "site.whyUs": z.array(z.object({ title: z.string().trim().min(2).max(60), text: z.string().trim().min(2).max(200) })).max(8),
  "site.faq": z.array(z.object({ q: z.string().trim().min(3).max(200), a: z.string().trim().min(3).max(1500) })).max(40),
} as const;
export type CmsKey = keyof typeof cmsSchemas;
