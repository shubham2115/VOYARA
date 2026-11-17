import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, EmptyState, statusTone } from "@/components/ui/misc";
import { formatDate, formatINR, humanize } from "@/lib/utils";

export const metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

export default async function Bookings() {
  const user = await requirePageUser();
  const items = await db.booking.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, include: { package: { select: { name: true } } } });
  return (
    <div>
      <h1 className="mb-6 text-3xl">My Bookings</h1>
      {items.length === 0 ? <EmptyState title="No bookings yet" description="Once an enquiry is converted into a booking it will appear here." /> : (
        <ul className="space-y-3">{items.map((b) => (
          <li key={b.id}><Link href={`/account/bookings/${b.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 hover:shadow-lift">
            <div><p className="font-serif text-lg">{b.package?.name ?? "Custom trip"}</p><p className="text-sm text-navy-400">{b.reference} · Travel {formatDate(b.travelDate)} · {formatINR(b.totalAmount)} (paid {formatINR(b.amountPaid)})</p></div>
            <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge></Link></li>
        ))}</ul>
      )}
    </div>
  );
}
