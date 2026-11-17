import { db } from "@/lib/db";
import { ok, pageMeta, pageParams, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { packageSchema } from "@/lib/validators/catalog";
import { savePackage } from "@/server/services/admin-catalog";

export const GET = route(async (req) => {
  await requireApiUser("package:manage");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const { page, size, skip, take } = pageParams(url, { size: 20, max: 100 });
  const where = { deletedAt: null, ...(q && { name: { contains: q, mode: "insensitive" as const } }) };
  const [items, total] = await Promise.all([db.tourPackage.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { destination: { select: { name: true } } } }), db.tourPackage.count({ where })]);
  return ok(items, { meta: pageMeta(total, page, size) });
});

export const POST = route(async (req) => {
  const user = await requireApiUser("package:manage");
  return ok(await savePackage(user.id, await parseBody(req, packageSchema)), { status: 201 });
});
