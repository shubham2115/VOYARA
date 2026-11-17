import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { BlogForm } from "@/components/admin/content-admin";

export const metadata = { title: "Edit article" };
export const dynamic = "force-dynamic";

export default async function EditBlog({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser({ permission: "blog:manage" });
  const [b, destinations] = await Promise.all([
    db.blog.findFirst({ where: { id: (await params).id, deletedAt: null }, include: { category: true } }),
    db.destination.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!b) notFound();
  return <div className="space-y-6"><h1 className="text-3xl">Edit article</h1><BlogForm destinations={destinations} initial={{ id: b.id, title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, coverImage: b.coverImage, categoryName: b.category?.name ?? "", destinationId: b.destinationId ?? "", seoTitle: b.seoTitle ?? "", seoDescription: b.seoDescription ?? "", isPublished: b.isPublished }} /></div>;
}
