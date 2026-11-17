import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/misc";
import { BookingControls, PaymentForm } from "@/components/admin/booking-actions";
import { getBookingDetail } from "@/server/services/admin-bookings";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser({ permission: "admin:access" });
  const b = await getBookingDetail(user, (await params).id);
  if (!b) notFound();
  const canAssign = can(user.role, "enquiry:assign");
  const staff = canAssign ? await db.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] }, isActive: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  const due = b.totalAmount - b.amountPaid;
  const rows: [string, string][] = [["Package", b.package?.name ?? "Custom trip"], ["Travel date", formatDate(b.travelDate)], ["Travellers", `${b.adults} adults, ${b.children} children, ${b.rooms} room(s)`], ["Total", formatINR(b.totalAmount)], ["Discount", b.discountAmount ? `${formatINR(b.discountAmount)}${b.coupon ? ` (${b.coupon.code})` : ""}` : "—"], ["Paid", formatINR(b.amountPaid)], ["Balance due", formatINR(due)], ["Notes", b.notes ?? "—"]];
  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm text-navy-400 hover:underline">← All bookings</Link>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-mono text-2xl">{b.reference}</h1><Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge>
        {b.enquiry && <Link href={`/admin/enquiries/${b.enquiry.id}`} className="text-sm underline">from {b.enquiry.reference}</Link>}</div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5"><h2 className="mb-3 text-xl">Customer</h2><p className="font-medium">{b.user.name}</p><p className="text-sm text-navy-400">{b.user.email} · {b.user.phone ?? "no phone"}</p>
            {b.user.phone && <Button asChild variant="outline" size="sm" className="mt-3"><a href={`https://wa.me/${b.user.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button>}</section>
          <section className="card p-5"><h2 className="mb-3 text-xl">Booking details</h2><dl className="divide-y divide-navy-50 text-sm">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-3 gap-2 py-2"><dt className="text-navy-400">{k}</dt><dd className="col-span-2">{v}</dd></div>)}</dl>
            <div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><a href={`/api/customer/bookings/${b.id}/invoice`}><Download className="h-4 w-4" /> Invoice PDF</a></Button>
              {b.package && <Button asChild variant="outline" size="sm"><a href={`/api/packages/${b.package.slug}/itinerary`}><Download className="h-4 w-4" /> Confirmation / itinerary PDF</a></Button>}</div></section>
          <section className="card p-5"><h2 className="mb-3 text-xl">Payments</h2>{b.payments.length === 0 ? <p className="text-sm text-navy-300">No payments recorded.</p> : <ul className="divide-y divide-navy-50 text-sm">{b.payments.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{formatDate(p.paidAt)} · {humanize(p.method)}{p.reference ? ` · ${p.reference}` : ""}</span><b>{formatINR(p.amount)}</b></li>)}</ul>}</section>
        </div>
        <div className="space-y-6">
          {can(user.role, "booking:manage") && <BookingControls id={b.id} status={b.status} assignedToId={b.assignedTo?.id ?? null} staff={staff} canAssign={canAssign} />}
          {can(user.role, "payment:manage") && <PaymentForm id={b.id} due={Math.max(0, due)} />}
        </div>
      </div>
    </div>
  );
}
