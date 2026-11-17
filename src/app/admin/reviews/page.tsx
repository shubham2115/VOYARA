import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, EmptyState } from "@/components/ui/misc";
import { ReviewActions } from "@/components/admin/content-admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function Reviews() {
  await requirePageUser({ permission: "review:manage" });
  const items = await db.review.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, include: { user: { select: { name: true } }, package: { select: { name: true } } } });
  return (
    <div className="space-y-6"><h1 className="text-3xl">Reviews</h1>
      {items.length === 0 ? <EmptyState title="No reviews yet" description="Verified customers can review completed trips." /> : (
        <ul className="space-y-3">{items.map((r) => (
          <li key={r.id} className="card flex flex-wrap items-start justify-between gap-4 p-5"><div className="min-w-0 flex-1"><p className="font-medium">{r.user.name} · {r.package?.name} · <span className="text-gold-600">{"★".repeat(r.rating)}</span></p>{r.title && <p className="text-sm font-medium">{r.title}</p>}<p className="mt-1 text-sm text-navy-600">{r.body}</p><p className="mt-1 text-xs text-navy-300">{formatDate(r.createdAt)}</p></div>
            <div className="flex flex-col items-end gap-2"><Badge tone={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "amber"}>{r.status}</Badge><ReviewActions id={r.id} status={r.status} /></div></li>))}</ul>)}</div>
  );
}
