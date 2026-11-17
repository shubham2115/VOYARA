import { CalendarCheck, CheckCircle2, IndianRupee, Inbox, MessageSquare, TrendingUp, Users } from "lucide-react";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getDashboard } from "@/server/services/analytics";
import { BarsChart, ChartCard, DonutChart, TrendChart } from "@/components/admin/charts";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requirePageUser({ permission: "admin:access" });
  const staffScope = can(user.role, "report:view") ? undefined : user.id;
  const d = await getDashboard(staffScope);
  const c = d.cards;
  const cards = [
    { l: "Total Enquiries", v: c.totalEnq, i: MessageSquare }, { l: "New Enquiries", v: c.newEnq, i: Inbox },
    { l: "Total Bookings", v: c.totalBook, i: CalendarCheck }, { l: "Confirmed Bookings", v: c.confirmed, i: CheckCircle2 },
    ...(staffScope ? [] : [{ l: "Total Customers", v: c.customers, i: Users }]),
    { l: "Revenue", v: formatINR(c.revenue), i: IndianRupee }, { l: "Conversion Rate", v: `${c.conversion}%`, i: TrendingUp },
  ];
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl">{staffScope ? "My workload" : "Dashboard"}</h1><p className="text-sm text-navy-400">{staffScope ? "Figures for enquiries and bookings assigned to you." : "Live figures from the database. Demo records use the sample.voyara.dev domain."}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((x) => <div key={x.l} className="card flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700"><x.i className="h-5 w-5" /></span><div><p className="text-xs uppercase tracking-wide text-navy-300">{x.l}</p><p className="font-serif text-2xl">{x.v}</p></div></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Monthly enquiries"><BarsChart data={d.enquiriesMonthly} /></ChartCard>
        <ChartCard title="Monthly bookings"><BarsChart data={d.bookingsMonthly} /></ChartCard>
        <ChartCard title="Revenue trend (collected)"><TrendChart data={d.revenueMonthly} money /></ChartCard>
        <ChartCard title="Enquiry conversion by status" empty={!d.funnel.length}><DonutChart data={d.funnel} /></ChartCard>
        <ChartCard title="Most popular destinations (by enquiries)" empty={!d.topDestinations.length}><BarsChart data={d.topDestinations} horizontal /></ChartCard>
        <ChartCard title="Most popular packages (by enquiries)" empty={!d.topPackages.length}><BarsChart data={d.topPackages} horizontal /></ChartCard>
      </div>
    </div>
  );
}
