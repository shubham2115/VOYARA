import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Travel Blog", description: "Destination guides, itineraries and travel tips for exploring India." };
export const dynamic = "force-dynamic";
const SIZE = 9;

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; category?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { isPublished: true, deletedAt: null, publishedAt: { lte: new Date() }, ...(sp.category && { category: { slug: sp.category } }) };
  const [posts, total, cats] = await Promise.all([
    db.blog.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { category: true } }),
    db.blog.count({ where }),
    db.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="container py-12">
      <p className="eyebrow">Travel blog</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Guides & stories</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/blog" className="rounded-full border border-navy-200 bg-white px-4 py-1.5 text-sm hover:border-navy">All</Link>
        {cats.map((c) => <Link key={c.id} href={`/blog?category=${c.slug}`} className={`rounded-full border px-4 py-1.5 text-sm ${sp.category === c.slug ? "border-navy bg-navy text-white" : "border-navy-200 bg-white hover:border-navy"}`}>{c.name}</Link>)}
      </div>
      {posts.length === 0 ? <div className="mt-8"><EmptyState title="No articles yet" description="Check back soon for new travel guides." /></div> : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((b) => (
            <Link key={b.id} href={`/blog/${b.slug}`} className="card group overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden"><Image src={b.coverImage} alt={b.title} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="p-5"><p className="eyebrow">{b.category?.name} · {formatDate(b.publishedAt)}</p><h2 className="mt-1 text-xl group-hover:text-gold-600">{b.title}</h2><p className="mt-2 line-clamp-3 text-sm text-navy-400">{b.excerpt}</p></div>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / SIZE))} basePath="/blog" params={sp} />
    </div>
  );
}
