import { db } from "@/lib/db";
import { ok, pageMeta, pageParams, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";

export const GET = route(async (req) => {
  const user = await requireApiUser();
  const { page, size, skip, take } = pageParams(new URL(req.url), { size: 10, max: 50 });
  const where = { userId: user.id, deletedAt: null };
  const [items, total] = await Promise.all([
    db.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { package: { select: { name: true, slug: true } } } }),
    db.booking.count({ where }),
  ]);
  return ok(items, { meta: pageMeta(total, page, size) });
});
