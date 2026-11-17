import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge, EmptyState, Pagination, statusTone } from "@/components/ui/misc";
import { ENQUIRY_STATUSES } from "@/lib/validators/enquiry";
import { listEnquiries } from "@/server/services/admin-enquiries";
import { formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";
type SP = Record<string, string | undefined>;

export default async function AdminEnquiries({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requirePageUser({ permission: "admin:access" });
  const sp = await searchParams;
  const isAdmin = can(user.role, "enquiry:read:all");
  const [r, staff] = await Promise.all([
    listEnquiries(user, { q: sp.q, status: sp.status, assigned: sp.assigned, sort: sp.sort, page: Number(sp.page) || 1 }),
    isAdmin ? db.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] }, isActive: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl">Enquiries</h1><p className="text-sm text-navy-400">{isAdmin ? "All customer enquiries" : "Enquiries assigned to you"} · {r.total} total</p></div>
      <form className="card grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <Input name="q" defaultValue={sp.q} placeholder="Search name, email, phone, reference" aria-label="Search" />
        <Select name="status" defaultValue={sp.status ?? ""} aria-label="Status"><option value="">All statuses</option>{ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select>
        {isAdmin ? <Select name="assigned" defaultValue={sp.assigned ?? ""} aria-label="Assigned"><option value="">Any staff</option><option value="none">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select> : <span />}
        <Select name="sort" defaultValue={sp.sort ?? "newest"} aria-label="Sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="travel">Travel date</option></Select>
        <Button type="submit">Filter</Button>
      </form>
      {r.items.length === 0 ? <EmptyState title="No enquiries found" description="New customer enquiries appear here automatically." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Ref", "Customer", "Package / Destination", "Travel", "Pax", "Budget", "Received", "Assigned", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-navy-50">
              {r.items.map((e) => (
                <tr key={e.id} className="hover:bg-navy-50/50">
                  <td className="px-4 py-3"><Link href={`/admin/enquiries/${e.id}`} className="font-mono text-xs font-semibold text-navy underline">{e.reference}</Link></td>
                  <td className="px-4 py-3"><p className="font-medium">{e.name}</p><p className="text-xs text-navy-400">{e.email} · {e.phone}</p></td>
                  <td className="px-4 py-3">{e.package?.name ?? e.destination?.name ?? "Custom"}</td>
                  <td className="px-4 py-3">{formatDate(e.travelDate)}</td>
                  <td className="px-4 py-3">{e.adults + e.children}</td>
                  <td className="px-4 py-3">{e.budgetPerPerson ? `₹${e.budgetPerPerson.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-3">{e.assignedTo?.name ?? <span className="text-navy-300">—</span>}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(e.status)}>{humanize(e.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={r.page} totalPages={r.totalPages} basePath="/admin/enquiries" params={sp} />
    </div>
  );
}
