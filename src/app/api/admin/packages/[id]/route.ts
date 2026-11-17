import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { packageSchema } from "@/lib/validators/catalog";
import { deletePackage, savePackage } from "@/server/services/admin-catalog";

export const GET = route(async (_req, ctx) => {
  await requireApiUser("package:manage");
  const p = await db.tourPackage.findFirst({ where: { id: (await ctx.params).id, deletedAt: null }, include: { images: { orderBy: { sortOrder: "asc" } }, itinerary: { orderBy: { dayNumber: "asc" } }, inclusions: { orderBy: { sortOrder: "asc" } }, exclusions: { orderBy: { sortOrder: "asc" } } } });
  if (!p) throw new ApiError(404, "Package not found");
  return ok(p);
});

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("package:manage");
  const id = (await ctx.params).id;
  if (!(await db.tourPackage.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))) throw new ApiError(404, "Package not found");
  return ok(await savePackage(user.id, await parseBody(req, packageSchema), id));
});

export const DELETE = route(async (_req, ctx) => {
  const user = await requireApiUser("package:manage");
  await deletePackage(user.id, (await ctx.params).id);
  return ok({ deleted: true });
});
