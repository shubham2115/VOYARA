import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, EmptyState, Pagination, statusTone } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "My Enquiries" };
export const dynamic = "force-dynamic";
const SIZE = 10;

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requirePageUser();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const where = { userId: user.id, deletedAt: null };
  const [items, total] = await Promise.all([
    db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { package: { select: { name: true } }, destination: { select: { name: true } } } }),
    db.enquiry.count({ where }),
  ]);
  return (
    <div>
      <h1 className="mb-6 text-3xl">My Enquiries</h1>
      {items.length === 0 ? <EmptyState title="No enquiries yet" action={<Button asChild variant="gold"><Link href="/customize-trip">Plan a trip</Link></Button>} /> : (
        <ul className="space-y-3">{items.map((e) => (
          <li key={e.id}><Link href={`/account/enquiries/${e.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 hover:shadow-lift">
            <div><p className="font-serif text-lg">{e.package?.name ?? e.destination?.name ?? "Custom trip"}</p><p className="text-sm text-navy-400">{e.reference} · Submitted {formatDate(e.createdAt)} · Travel {formatDate(e.travelDate)} · {e.adults + e.children} traveller(s)</p></div>
            <Badge tone={statusTone(e.status)}>{humanize(e.status)}</Badge></Link></li>
        ))}</ul>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / SIZE))} basePath="/account/enquiries" params={{}} />
    </div>
  );
}
