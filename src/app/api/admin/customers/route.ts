import { db } from "@/lib/db";
import { ok, pageMeta, pageParams, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";

export const GET = route(async (req) => {
  await requireApiUser("customer:read");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const { page, size, skip, take } = pageParams(url, { size: 15, max: 100 });
  const where = { role: "CUSTOMER" as const, deletedAt: null, ...(q && { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] }) };
  const [items, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, _count: { select: { bookings: true, enquiries: true } } } }),
    db.user.count({ where }),
  ]);
  return ok(items, { meta: pageMeta(total, page, size) });
});
