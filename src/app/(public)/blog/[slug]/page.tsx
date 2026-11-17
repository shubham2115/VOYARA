import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

const getPost = (slug: string) =>
  db.blog.findFirst({ where: { slug, isPublished: true, deletedAt: null }, include: { category: true, destination: { select: { name: true, slug: true } } } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getPost((await params).slug);
  if (!b) return {};
  return { title: b.seoTitle ?? b.title, description: b.seoDescription ?? b.excerpt, openGraph: { images: [b.coverImage], type: "article" } };
}

/** Minimal safe markdown subset (##, lists, paragraphs). Rendered as React nodes, never raw HTML. */
function Body({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((block, i) => {
        if (block.startsWith("## ")) {
          const [h, ...rest] = block.split("\n");
          return <div key={i}><h2 className="mt-8 text-2xl">{h.slice(3)}</h2>{rest.length > 0 && <p className="mt-2">{rest.join(" ")}</p>}</div>;
        }
        const lines = block.split("\n");
        if (lines.every((l) => /^(- |\d+\. )/.test(l)))
          return <ul key={i} className="my-4 list-disc space-y-1 pl-6">{lines.map((l, j) => <li key={j}>{l.replace(/^(- |\d+\. )/, "")}</li>)}</ul>;
        return <p key={i} className="mt-4">{block}</p>;
      })}
    </>
  );
}

export default async function BlogPost({ params }: Props) {
  const b = await getPost((await params).slug);
  if (!b) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: b.title, image: b.coverImage, datePublished: b.publishedAt?.toISOString(), description: b.excerpt };
  return (
    <article className="container max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="eyebrow">{b.category?.name} · {formatDate(b.publishedAt)}</p>
      <h1 className="mt-2 text-4xl md:text-5xl">{b.title}</h1>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl"><Image src={b.coverImage} alt={b.title} fill priority sizes="768px" className="object-cover" /></div>
      <div className="mt-8 leading-relaxed text-navy-600"><Body text={b.content} /></div>
      {b.destination && <p className="mt-10 rounded-2xl bg-gold-50 p-5">Ready to go? <Link className="font-semibold underline" href={`/destinations/${b.destination.slug}`}>Explore {b.destination.name} packages</Link></p>}
    </article>
  );
}
