import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Badge, EmptyState, Pagination } from "@/components/ui/misc";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Tour Packages" };
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminPackages({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePageUser({ permission: "package:manage" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { deletedAt: null, ...(sp.q && { name: { contains: sp.q, mode: "insensitive" as const } }) };
  const [items, total] = await Promise.all([db.tourPackage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { destination: { select: { name: true } } } }), db.tourPackage.count({ where })]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl">Tour Packages</h1><p className="text-sm text-navy-400">{total} packages</p></div><Button asChild><Link href="/admin/packages/new"><Plus className="h-4 w-4" /> New package</Link></Button></div>
      <form className="card flex gap-3 p-4"><Input name="q" defaultValue={sp.q} placeholder="Search packages" aria-label="Search" /><Button type="submit">Search</Button></form>
      {items.length === 0 ? <EmptyState title="No packages" /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Package", "Destination", "Duration", "Price", "Availability", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-navy-50">{items.map((p) => (
            <tr key={p.id}><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3">{p.destination.name}</td><td className="px-4 py-3">{p.durationNights}N/{p.durationDays}D</td>
              <td className="px-4 py-3">{formatINR(p.discountedPrice ?? p.price)}</td><td className="px-4 py-3"><Badge tone={p.isAvailable ? "green" : "amber"}>{p.isAvailable ? "Available" : "Sold out"}</Badge></td>
              <td className="px-4 py-3"><Badge tone={p.isPublished ? "green" : "gray"}>{p.isPublished ? "Published" : "Draft"}</Badge></td>
              <td className="flex justify-end gap-1 px-4 py-2"><Button asChild size="icon" variant="ghost" aria-label={`Edit ${p.name}`}><Link href={`/admin/packages/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button><DeleteButton url={`/api/admin/packages/${p.id}`} label={p.name} /></td></tr>))}</tbody></table></div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / SIZE))} basePath="/admin/packages" params={sp} />
    </div>
  );
}
