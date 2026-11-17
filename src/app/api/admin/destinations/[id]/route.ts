import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { destinationSchema } from "@/lib/validators/catalog";
import { deleteDestination, saveDestination } from "@/server/services/admin-catalog";

export const GET = route(async (_req, ctx) => {
  await requireApiUser("destination:manage");
  const d = await db.destination.findFirst({ where: { id: (await ctx.params).id, deletedAt: null }, include: { images: { orderBy: { sortOrder: "asc" } } } });
  if (!d) throw new ApiError(404, "Destination not found");
  return ok(d);
});

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("destination:manage");
  const id = (await ctx.params).id;
  if (!(await db.destination.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))) throw new ApiError(404, "Destination not found");
  return ok(await saveDestination(user.id, await parseBody(req, destinationSchema), id));
});

export const DELETE = route(async (_req, ctx) => {
  const user = await requireApiUser("destination:manage");
  await deleteDestination(user.id, (await ctx.params).id);
  return ok({ deleted: true });
});
