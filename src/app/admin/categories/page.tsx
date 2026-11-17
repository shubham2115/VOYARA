import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { CategoryForm, RowDelete } from "@/components/admin/content-admin";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function Categories() {
  await requirePageUser({ permission: "category:manage" });
  const cats = await db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { destinations: true } } } });
  return (
    <div className="space-y-6"><h1 className="text-3xl">Categories</h1><CategoryForm />
      <div className="card divide-y divide-navy-50">{cats.map((c) => <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><div><p className="font-medium">{c.name}</p><p className="text-xs text-navy-400">{c.description ?? "—"} · {c._count.destinations} destinations</p></div><RowDelete url={`/api/admin/categories/${c.id}`} label={c.name} /></div>)}</div></div>
  );
}
