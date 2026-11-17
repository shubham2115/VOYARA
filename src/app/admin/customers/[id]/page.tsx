import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { Badge, statusTone } from "@/components/ui/misc";
import { ToggleActive } from "@/components/admin/user-actions";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePageUser({ permission: "customer:read" });
  const u = await db.user.findFirst({
    where: { id: (await params).id, role: "CUSTOMER", deletedAt: null },
    include: { enquiries: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20 }, bookings: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20, include: { package: { select: { name: true } } } } },
  });
  if (!u) notFound();
  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-navy-400 hover:underline">← All customers</Link>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div><h1 className="text-3xl">{u.name}</h1><p className="text-navy-400">{u.email} · {u.phone ?? "no phone"} · joined {formatDate(u.createdAt)}</p><Badge tone={u.isActive ? "green" : "red"} className="mt-2">{u.isActive ? "Active" : "Inactive"}</Badge></div>
        {can(admin.role, "customer:manage") && <ToggleActive url={`/api/admin/customers/${u.id}`} isActive={u.isActive} label={u.name} />}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-3 text-xl">Enquiry history</h2>{u.enquiries.length === 0 ? <p className="text-sm text-navy-300">None</p> : <ul className="divide-y divide-navy-50 text-sm">{u.enquiries.map((e) => <li key={e.id} className="flex items-center justify-between py-2"><Link className="font-mono text-xs underline" href={`/admin/enquiries/${e.id}`}>{e.reference}</Link><span className="flex items-center gap-2 text-xs text-navy-400">{formatDate(e.createdAt)} <Badge tone={statusTone(e.status)}>{humanize(e.status)}</Badge></span></li>)}</ul>}</section>
        <section className="card p-5"><h2 className="mb-3 text-xl">Booking history</h2>{u.bookings.length === 0 ? <p className="text-sm text-navy-300">None</p> : <ul className="divide-y divide-navy-50 text-sm">{u.bookings.map((b) => <li key={b.id} className="flex items-center justify-between py-2"><Link className="font-mono text-xs underline" href={`/admin/bookings/${b.id}`}>{b.reference}</Link><span className="flex items-center gap-2 text-xs text-navy-400">{b.package?.name} · {formatINR(b.totalAmount)} <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge></span></li>)}</ul>}</section>
      </div>
    </div>
  );
}
