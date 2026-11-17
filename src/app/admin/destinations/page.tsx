import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Badge, EmptyState, Pagination } from "@/components/ui/misc";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Destinations" };
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminDestinations({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePageUser({ permission: "destination:manage" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { deletedAt: null, ...(sp.q && { name: { contains: sp.q, mode: "insensitive" as const } }) };
  const [items, total] = await Promise.all([db.destination.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * SIZE, take: SIZE, include: { category: { select: { name: true } }, _count: { select: { packages: { where: { deletedAt: null } } } } } }), db.destination.count({ where })]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl">Destinations</h1><p className="text-sm text-navy-400">{total} destinations</p></div><Button asChild><Link href="/admin/destinations/new"><Plus className="h-4 w-4" /> New destination</Link></Button></div>
      <form className="card flex gap-3 p-4"><Input name="q" defaultValue={sp.q} placeholder="Search destinations" aria-label="Search" /><Button type="submit">Search</Button></form>
      {items.length === 0 ? <EmptyState title="No destinations" /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Name", "State", "Category", "Packages", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-navy-50">{items.map((d) => (
            <tr key={d.id}><td className="px-4 py-3 font-medium">{d.name}</td><td className="px-4 py-3">{d.state}</td><td className="px-4 py-3">{d.category?.name ?? "—"}</td><td className="px-4 py-3">{d._count.packages}</td>
              <td className="px-4 py-3"><Badge tone={d.isPublished ? "green" : "gray"}>{d.isPublished ? "Published" : "Draft"}</Badge></td>
              <td className="flex justify-end gap-1 px-4 py-2"><Button asChild size="icon" variant="ghost" aria-label={`Edit ${d.name}`}><Link href={`/admin/destinations/${d.id}`}><Pencil className="h-4 w-4" /></Link></Button><DeleteButton url={`/api/admin/destinations/${d.id}`} label={d.name} /></td></tr>))}</tbody></table></div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / SIZE))} basePath="/admin/destinations" params={sp} />
    </div>
  );
}
