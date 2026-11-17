import { db } from "@/lib/db";
import { ok, pageMeta, pageParams, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { destinationSchema } from "@/lib/validators/catalog";
import { saveDestination } from "@/server/services/admin-catalog";

export const GET = route(async (req) => {
  await requireApiUser("destination:manage");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const { page, size, skip, take } = pageParams(url, { size: 20, max: 100 });
  const where = { deletedAt: null, ...(q && { name: { contains: q, mode: "insensitive" as const } }) };
  const [items, total] = await Promise.all([db.destination.findMany({ where, orderBy: { name: "asc" }, skip, take }), db.destination.count({ where })]);
  return ok(items, { meta: pageMeta(total, page, size) });
});

export const POST = route(async (req) => {
  const user = await requireApiUser("destination:manage");
  return ok(await saveDestination(user.id, await parseBody(req, destinationSchema)), { status: 201 });
});
