import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, EmptyState, statusTone } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function Overview() {
  const user = await requirePageUser();
  const [enq, book, wish, recent] = await Promise.all([
    db.enquiry.count({ where: { userId: user.id, deletedAt: null } }),
    db.booking.count({ where: { userId: user.id, deletedAt: null } }),
    db.wishlist.count({ where: { userId: user.id } }),
    db.enquiry.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 4, include: { package: { select: { name: true } }, destination: { select: { name: true } } } }),
  ]);
  const stats = [["Enquiries", enq, "/account/enquiries"], ["Bookings", book, "/account/bookings"], ["Wishlist", wish, "/account/wishlist"]] as const;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">{stats.map(([l, n, h]) => <Link key={l} href={h} className="card p-5 transition hover:shadow-lift"><p className="text-sm text-navy-400">{l}</p><p className="font-serif text-4xl">{n}</p></Link>)}</div>
      <section>
        <h2 className="mb-3 text-xl">Recent enquiries</h2>
        {recent.length === 0 ? <EmptyState title="No enquiries yet" description="Find a package you love and send us an enquiry." action={<Button asChild variant="gold"><Link href="/packages">Browse packages</Link></Button>} /> : (
          <ul className="space-y-3">{recent.map((e) => (
            <li key={e.id}><Link href={`/account/enquiries/${e.id}`} className="card flex items-center justify-between gap-3 p-4 hover:shadow-lift">
              <div><p className="font-medium">{e.package?.name ?? e.destination?.name ?? "Custom trip"}</p><p className="text-xs text-navy-400">{e.reference} · {formatDate(e.createdAt)}</p></div>
              <Badge tone={statusTone(e.status)}>{humanize(e.status)}</Badge></Link></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
