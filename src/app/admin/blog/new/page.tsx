import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { BlogForm } from "@/components/admin/content-admin";

export const metadata = { title: "New article" };
export const dynamic = "force-dynamic";

export default async function NewBlog() {
  await requirePageUser({ permission: "blog:manage" });
  const destinations = await db.destination.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <div className="space-y-6"><h1 className="text-3xl">New article</h1><BlogForm destinations={destinations} initial={{ title: "", slug: "", excerpt: "", content: "", coverImage: "", categoryName: "", destinationId: "", seoTitle: "", seoDescription: "", isPublished: false }} /></div>;
}
