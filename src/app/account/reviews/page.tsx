import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { Badge, EmptyState } from "@/components/ui/misc";
import { ReviewForm } from "@/components/site/account-forms";
import { formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "My Reviews" };
export const dynamic = "force-dynamic";

export default async function Reviews() {
  const u = await requirePageUser();
  const [reviews, reviewable] = await Promise.all([
    db.review.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, include: { package: { select: { name: true } } } }),
    db.booking.findMany({ where: { userId: u.id, status: "COMPLETED", deletedAt: null, review: null }, include: { package: { select: { name: true } } } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl">My Reviews</h1>
      {reviewable.length > 0 && <section className="space-y-4"><h2 className="text-xl">Share your experience</h2>{reviewable.map((b) => <ReviewForm key={b.id} bookingId={b.id} label={`How was ${b.package?.name ?? "your trip"}?`} />)}</section>}
      <section>
        <h2 className="mb-3 text-xl">Submitted reviews</h2>
        {reviews.length === 0 ? <EmptyState title="No reviews yet" description="You can review a trip once it is marked completed." /> : (
          <ul className="space-y-3">{reviews.map((r) => <li key={r.id} className="card p-5"><div className="flex justify-between"><p className="font-medium">{r.package?.name} · {"★".repeat(r.rating)}</p><Badge tone={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "amber"}>{humanize(r.status)}</Badge></div><p className="mt-1 text-sm text-navy-600">{r.body}</p><p className="mt-1 text-xs text-navy-300">{formatDate(r.createdAt)}</p></li>)}</ul>
        )}
      </section>
    </div>
  );
}
