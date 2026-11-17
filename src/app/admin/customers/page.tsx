import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Badge, EmptyState, Pagination } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";
const SIZE = 15;

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePageUser({ permission: "customer:read" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { role: "CUSTOMER" as const, deletedAt: null, ...(sp.q && { OR: [{ name: { contains: sp.q, mode: "insensitive" as const } }, { email: { contains: sp.q, mode: "insensitive" as const } }, { phone: { contains: sp.q } }] }) };
  const [items, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, _count: { select: { bookings: true, enquiries: true } } } }),
    db.user.count({ where }),
  ]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl">Customers</h1><p className="text-sm text-navy-400">{total} registered</p></div>
      <form className="card flex gap-3 p-4"><Input name="q" defaultValue={sp.q} placeholder="Search name, email or phone" aria-label="Search" /><Button type="submit">Search</Button></form>
      {items.length === 0 ? <EmptyState title="No customers found" /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Customer", "Phone", "Enquiries", "Bookings", "Joined", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-navy-50">{items.map((u) => (
            <tr key={u.id} className="hover:bg-navy-50/50"><td className="px-4 py-3"><Link href={`/admin/customers/${u.id}`} className="font-medium underline">{u.name}</Link><p className="text-xs text-navy-400">{u.email}</p></td>
              <td className="px-4 py-3">{u.phone ?? "—"}</td><td className="px-4 py-3">{u._count.enquiries}</td><td className="px-4 py-3">{u._count.bookings}</td><td className="px-4 py-3">{formatDate(u.createdAt)}</td>
              <td className="px-4 py-3"><Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Inactive"}</Badge></td></tr>))}</tbody></table></div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / SIZE))} basePath="/admin/customers" params={sp} />
    </div>
  );
}
