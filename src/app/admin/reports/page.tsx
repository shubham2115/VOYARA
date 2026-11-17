import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/server/services/analytics";
import { BarsChart, ChartCard, TrendChart } from "@/components/admin/charts";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function Reports() {
  await requirePageUser({ permission: "report:view" });
  const [d, byStatus, outstanding] = await Promise.all([
    getDashboard(),
    db.booking.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true, _sum: { totalAmount: true, amountPaid: true } }),
    db.booking.aggregate({ where: { deletedAt: null, status: { notIn: ["CANCELLED"] } }, _sum: { totalAmount: true, amountPaid: true } }),
  ]);
  const due = (outstanding._sum.totalAmount ?? 0) - (outstanding._sum.amountPaid ?? 0);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Reports</h1>
        <div className="flex flex-wrap gap-2">{["bookings", "enquiries", "payments"].map((t) => <Button key={t} asChild variant="outline" size="sm"><a href={`/api/admin/reports/export?type=${t}`}><Download className="h-4 w-4" /> {t[0].toUpperCase() + t.slice(1)} CSV</a></Button>)}</div></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs uppercase text-navy-300">Revenue collected</p><p className="font-serif text-3xl">{formatINR(d.cards.revenue)}</p></div>
        <div className="card p-5"><p className="text-xs uppercase text-navy-300">Outstanding balance</p><p className="font-serif text-3xl">{formatINR(due)}</p></div>
        <div className="card p-5"><p className="text-xs uppercase text-navy-300">Enquiry → booking</p><p className="font-serif text-3xl">{d.cards.conversion}%</p></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2"><ChartCard title="Revenue trend"><TrendChart data={d.revenueMonthly} money /></ChartCard><ChartCard title="Bookings per month"><BarsChart data={d.bookingsMonthly} /></ChartCard></div>
      <section className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-300"><tr>{["Booking status", "Count", "Booked value", "Collected"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-navy-50">{byStatus.map((s) => <tr key={s.status}><td className="px-4 py-3">{s.status.replace(/_/g, " ")}</td><td className="px-4 py-3">{s._count}</td><td className="px-4 py-3">{formatINR(s._sum.totalAmount ?? 0)}</td><td className="px-4 py-3">{formatINR(s._sum.amountPaid ?? 0)}</td></tr>)}</tbody></table></section>
    </div>
  );
}
