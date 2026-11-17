import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog Management" };
export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  await requirePageUser({ permission: "blog:manage" });
  const posts = await db.blog.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { category: true } });
  return (
    <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-3xl">Blog Management</h1><Button asChild><Link href="/admin/blog/new"><Plus className="h-4 w-4" /> New article</Link></Button></div>
      {posts.length === 0 ? <EmptyState title="No articles" /> : <div className="card divide-y divide-navy-50">{posts.map((b) => (
        <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><div><p className="font-medium">{b.title}</p><p className="text-xs text-navy-400">{b.category?.name ?? "Uncategorised"} · {formatDate(b.createdAt)}</p></div>
          <div className="flex items-center gap-1"><Badge tone={b.isPublished ? "green" : "gray"}>{b.isPublished ? "Published" : "Draft"}</Badge><Button asChild size="icon" variant="ghost" aria-label={`Edit ${b.title}`}><Link href={`/admin/blog/${b.id}`}><Pencil className="h-4 w-4" /></Link></Button><DeleteButton url={`/api/admin/blog/${b.id}`} label={b.title} /></div></div>))}</div>}</div>
  );
}
