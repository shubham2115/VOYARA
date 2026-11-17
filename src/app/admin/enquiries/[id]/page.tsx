import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { Badge, statusTone } from "@/components/ui/misc";
import { EnquiryTimeline } from "@/components/site/timeline";
import { NoteForm, QuotationBuilder, ResendQuotation, StatusPanel } from "@/components/admin/enquiry-actions";
import { getEnquiryDetail } from "@/server/services/admin-enquiries";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser({ permission: "admin:access" });
  const e = await getEnquiryDetail(user, (await params).id);
  if (!e) notFound();
  const canAssign = can(user.role, "enquiry:assign");
  const staff = canAssign ? await db.user.findMany({ where: { role: { in: ["STAFF", "ADMIN"] }, isActive: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  const unit = e.package ? (e.package.discountedPrice ?? e.package.price) : (e.budgetPerPerson ?? 0);
  const details: [string, string][] = [
    ["Customer", e.name], ["Email", e.email], ["Phone", e.phone], ["Package", e.package?.name ?? "—"], ["Destination", e.destination?.name ?? "—"],
    ["Departure city", e.departureCity ?? "—"], ["Travel date", formatDate(e.travelDate)], ["Travellers", `${e.adults} adults, ${e.children} children, ${e.rooms} room(s)`],
    ["Budget / person", e.budgetPerPerson ? formatINR(e.budgetPerPerson) : "—"], ["Hotel / transport", `${e.hotelPreference ?? "—"} / ${e.transportPreference ?? "—"}`],
    ["Interests", e.interests.join(", ") || "—"], ["Coupon", e.couponCode ?? "—"], ["Enquiry date", formatDate(e.createdAt)], ["Message", e.message ?? "—"],
  ];
  return (
    <div className="space-y-6">
      <Link href="/admin/enquiries" className="text-sm text-navy-400 hover:underline">← All enquiries</Link>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-mono text-2xl">{e.reference}</h1><Badge tone={statusTone(e.status)}>{humanize(e.status)}</Badge><Badge tone="gray">{humanize(e.source)}</Badge></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5"><h2 className="mb-3 text-xl">Details</h2><dl className="divide-y divide-navy-50 text-sm">{details.map(([k, v]) => <div key={k} className="grid grid-cols-3 gap-2 py-2"><dt className="text-navy-400">{k}</dt><dd className="col-span-2 whitespace-pre-line">{v}</dd></div>)}</dl></section>
          {can(user.role, "quotation:manage") && <QuotationBuilder id={e.id} defaultTitle={`Quotation for ${e.package?.name ?? e.destination?.name ?? "custom trip"}`} defaultPrice={unit} travellers={Math.max(1, e.adults)} />}
          {e.quotations.length > 0 && (
            <section className="card p-5"><h2 className="mb-3 text-xl">Quotations</h2>
              <ul className="divide-y divide-navy-50">{e.quotations.map((q) => <li key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-mono font-semibold">{q.number}</p><p className="text-xs text-navy-400">{formatINR(q.total)} · {humanize(q.status)} · {formatDate(q.createdAt)}</p></div>{can(user.role, "quotation:manage") && <ResendQuotation enquiryId={e.id} quotationId={q.id} />}</li>)}</ul></section>
          )}
          <section className="card p-5"><h2 className="mb-3 text-xl">Notes & communication history</h2>
            {e.notes.length === 0 ? <p className="text-sm text-navy-300">No notes yet.</p> : <ul className="space-y-3">{e.notes.map((n) => <li key={n.id} className="rounded-xl bg-navy-50/70 p-3 text-sm"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-xs text-navy-400">{n.author.name} · {formatDate(n.createdAt)}{n.isCommunication && <Badge tone="gold" className="ml-2">{n.channel ?? "Contact"}</Badge>}</p></li>)}</ul>}
          </section>
        </div>
        <div className="space-y-6">
          <StatusPanel id={e.id} status={e.status} assignedToId={e.assignedToId} staff={staff} canAssign={canAssign} canConvert={can(user.role, "booking:manage")} hasBooking={!!e.booking} phone={e.phone} />
          {e.booking && <Link href={`/admin/bookings/${e.booking.id}`} className="card block p-4 text-sm font-semibold underline">Booking {e.booking.reference} →</Link>}
          <NoteForm id={e.id} />
          <section className="card p-5"><h2 className="mb-3 text-xl">Timeline</h2><EnquiryTimeline status={e.status} activities={e.activities} /></section>
        </div>
      </div>
    </div>
  );
}
