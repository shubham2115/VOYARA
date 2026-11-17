import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, statusTone } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { PayButton } from "@/components/site/pay-button";
import { razorpayConfigured } from "@/server/integrations/razorpay";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const b = await db.booking.findFirst({
    where: { id: (await params).id, userId: user.id, deletedAt: null },
    include: { package: { select: { name: true, slug: true } }, payments: { where: { status: "PAID" }, orderBy: { paidAt: "desc" } }, review: { select: { id: true } } },
  });
  if (!b) notFound();
  const due = b.totalAmount - b.amountPaid;
  const canPay = due > 0 && b.status !== "CANCELLED" && b.status !== "COMPLETED" && razorpayConfigured();
  return (
    <div className="space-y-8">
      <Link href="/account/bookings" className="text-sm text-navy-400 hover:underline">← All bookings</Link>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">{b.package?.name ?? "Custom trip"}</h1><Badge tone={statusTone(b.status)} className="text-sm">{humanize(b.status)}</Badge></div>
      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        {[["Reference", b.reference], ["Travel date", formatDate(b.travelDate)], ["Travellers", `${b.adults} adults, ${b.children} children`], ["Rooms", String(b.rooms)], ["Total", formatINR(b.totalAmount)], ["Paid", formatINR(b.amountPaid)], ["Balance due", formatINR(due)]].map(([k, v]) => <div key={k}><p className="text-xs uppercase tracking-wide text-navy-300">{k}</p><p className="font-medium">{v}</p></div>)}
      </section>
      {canPay && <section className="card p-6"><h2 className="mb-3 text-xl">Make a payment</h2><PayButton bookingId={b.id} due={due} name={user.name} email={user.email} /></section>}
      {due > 0 && !razorpayConfigured() && b.status !== "CANCELLED" && <p className="rounded-xl bg-gold-50 p-4 text-sm">Online payment is not enabled yet. Please contact our team to pay by UPI or bank transfer.</p>}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><a href={`/api/customer/bookings/${b.id}/invoice`}><Download className="h-4 w-4" /> Invoice PDF</a></Button>
        {b.package && <Button asChild variant="outline"><a href={`/api/packages/${b.package.slug}/itinerary`}><Download className="h-4 w-4" /> Itinerary PDF</a></Button>}
        {b.status === "COMPLETED" && !b.review && <Button asChild variant="gold"><Link href={`/account/reviews?booking=${b.id}`}>Write a review</Link></Button>}
      </div>
      {b.payments.length > 0 && <section><h2 className="mb-3 text-xl">Payments</h2><ul className="space-y-2">{b.payments.map((p) => <li key={p.id} className="card flex justify-between p-4 text-sm"><span>{formatDate(p.paidAt)} · {humanize(p.method)}</span><b>{formatINR(p.amount)}</b></li>)}</ul></section>}
    </div>
  );
}
