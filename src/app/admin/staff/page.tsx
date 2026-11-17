import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge } from "@/components/ui/misc";
import { StaffForm, ToggleActive } from "@/components/admin/user-actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Staff Management" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requirePageUser({ permission: "staff:manage" });
  const staff = await db.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] }, deletedAt: null }, orderBy: { createdAt: "asc" } });
  const [assigned, converted, closed] = await Promise.all([
    db.enquiry.groupBy({ by: ["assignedToId"], where: { assignedToId: { not: null }, deletedAt: null }, _count: true }),
    db.booking.groupBy({ by: ["assignedToId"], where: { assignedToId: { not: null }, deletedAt: null }, _count: true }),
    db.enquiry.groupBy({ by: ["assignedToId"], where: { assignedToId: { not: null }, status: { in: ["BOOKING_CONFIRMED", "CLOSED"] } }, _count: true }),
  ]);
  const n = (rows: { assignedToId: string | null; _count: number }[], id: string) => rows.find((r) => r.assignedToId === id)?._count ?? 0;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Staff Management</h1>
      <StaffForm />
      <div className="card overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Name", "Role", "Assigned enquiries", "Resolved", "Bookings handled", "Joined", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-navy-50">{staff.map((s) => (
          <tr key={s.id}><td className="px-4 py-3"><p className="font-medium">{s.name}</p><p className="text-xs text-navy-400">{s.email}</p></td><td className="px-4 py-3"><Badge tone={s.role === "ADMIN" ? "gold" : "navy"}>{s.role}</Badge></td>
            <td className="px-4 py-3">{n(assigned, s.id)}</td><td className="px-4 py-3">{n(closed, s.id)}</td><td className="px-4 py-3">{n(converted, s.id)}</td><td className="px-4 py-3">{formatDate(s.createdAt)}</td>
            <td className="px-4 py-3"><Badge tone={s.isActive ? "green" : "red"}>{s.isActive ? "Active" : "Inactive"}</Badge></td>
            <td className="px-4 py-3 text-right">{s.id !== me.id && <ToggleActive url={`/api/admin/staff/${s.id}`} isActive={s.isActive} label={s.name} />}</td></tr>))}</tbody></table></div>
    </div>
  );
}
