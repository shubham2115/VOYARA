import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("review:manage");
  const { status } = await parseBody(req, z.object({ status: z.enum(["APPROVED", "REJECTED", "PENDING"]) }));
  const id = (await ctx.params).id;
  const r = await db.review.update({ where: { id }, data: { status } });
  // Keep the denormalised rating aggregate on the package in sync
  if (r.packageId) {
    const agg = await db.review.aggregate({ where: { packageId: r.packageId, status: "APPROVED" }, _avg: { rating: true }, _count: true });
    await db.tourPackage.update({ where: { id: r.packageId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
  }
  await audit(user.id, "REVIEW_MODERATE", "Review", id, { status });
  return ok(r);
});
