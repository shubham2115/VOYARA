import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge, EmptyState, Pagination, statusTone } from "@/components/ui/misc";
import { BOOKING_STATUSES, listBookings } from "@/server/services/admin-bookings";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function AdminBookings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePageUser({ permission: "admin:access" });
  const sp = await searchParams;
  const r = await listBookings(user, { q: sp.q, status: sp.status, sort: sp.sort, page: Number(sp.page) || 1 });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl">Bookings</h1><p className="text-sm text-navy-400">{r.total} total</p></div>
        {can(user.role, "booking:manage") && <Button asChild><Link href="/admin/bookings/new"><Plus className="h-4 w-4" /> New booking</Link></Button>}</div>
      <form className="card grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
        <Input name="q" defaultValue={sp.q} placeholder="Search reference, customer name or email" aria-label="Search" />
        <Select name="status" defaultValue={sp.status ?? ""} aria-label="Status"><option value="">All statuses</option>{BOOKING_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select>
        <Select name="sort" defaultValue={sp.sort ?? "newest"} aria-label="Sort"><option value="newest">Newest</option><option value="travel">Travel date</option><option value="amount">Amount</option></Select>
        <Button type="submit">Filter</Button>
      </form>
      {r.items.length === 0 ? <EmptyState title="No bookings found" /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Ref", "Customer", "Package", "Travel", "Total", "Paid", "Staff", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-navy-50">{r.items.map((b) => (
            <tr key={b.id} className="hover:bg-navy-50/50">
              <td className="px-4 py-3"><Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs font-semibold underline">{b.reference}</Link></td>
              <td className="px-4 py-3"><p className="font-medium">{b.user.name}</p><p className="text-xs text-navy-400">{b.user.email}</p></td>
              <td className="px-4 py-3">{b.package?.name ?? "Custom"}</td><td className="px-4 py-3">{formatDate(b.travelDate)}</td>
              <td className="px-4 py-3">{formatINR(b.totalAmount)}</td><td className="px-4 py-3">{formatINR(b.amountPaid)}</td>
              <td className="px-4 py-3">{b.assignedTo?.name ?? "—"}</td><td className="px-4 py-3"><Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge></td>
            </tr>))}</tbody></table></div>
      )}
      <Pagination page={r.page} totalPages={r.totalPages} basePath="/admin/bookings" params={sp} />
    </div>
  );
}
