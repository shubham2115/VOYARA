import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, statusTone } from "@/components/ui/misc";
import { EnquiryTimeline } from "@/components/site/timeline";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  // Ownership enforced in the query itself: another customer's id simply 404s
  const e = await db.enquiry.findFirst({
    where: { id: (await params).id, userId: user.id, deletedAt: null },
    include: { package: { select: { name: true, slug: true } }, destination: { select: { name: true } }, activities: { orderBy: { createdAt: "desc" } }, quotations: { where: { status: { in: ["SENT", "APPROVED"] } }, orderBy: { createdAt: "desc" }, include: { items: true } }, booking: { select: { id: true, reference: true } } },
  });
  if (!e) notFound();
  const rows: [string, string][] = [
    ["Reference", e.reference], ["Destination", e.destination?.name ?? "—"], ["Travel date", formatDate(e.travelDate)],
    ["Travellers", `${e.adults} adults, ${e.children} children`], ["Budget / person", e.budgetPerPerson ? formatINR(e.budgetPerPerson) : "—"], ["Message", e.message ?? "—"],
  ];
  return (
    <div className="space-y-8">
      <Link href="/account/enquiries" className="text-sm text-navy-400 hover:underline">← All enquiries</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{e.package?.name ?? "Custom trip enquiry"}</h1>
        <Badge tone={statusTone(e.status)} className="text-sm">{humanize(e.status)}</Badge>
      </div>
      <section className="card p-6"><h2 className="mb-4 text-xl">Progress</h2><EnquiryTimeline status={e.status} activities={e.activities} /></section>
      {e.quotations.map((q) => (
        <section key={q.id} className="card p-6">
          <h2 className="text-xl">Quotation {q.number}</h2>
          <table className="mt-3 w-full text-sm"><tbody>{q.items.map((i) => <tr key={i.id} className="border-b border-navy-100"><td className="py-2">{i.description} × {i.quantity}</td><td className="py-2 text-right">{formatINR(i.unitPrice * i.quantity)}</td></tr>)}</tbody></table>
          <p className="mt-3 text-right text-lg font-bold">Total {formatINR(q.total)}</p>
          {q.validUntil && <p className="text-right text-xs text-navy-400">Valid until {formatDate(q.validUntil)}</p>}
        </section>
      ))}
      {e.booking && <p className="rounded-xl bg-emerald-50 p-4 text-sm">Booking <Link className="font-semibold underline" href={`/account/bookings/${e.booking.id}`}>{e.booking.reference}</Link> was created from this enquiry.</p>}
      <section className="card p-6"><h2 className="mb-3 text-xl">Details</h2><dl className="divide-y divide-navy-100 text-sm">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-3 gap-2 py-2"><dt className="text-navy-400">{k}</dt><dd className="col-span-2">{v}</dd></div>)}</dl></section>
    </div>
  );
}
