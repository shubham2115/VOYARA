import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { categorySchema } from "@/lib/validators/catalog";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("category:manage");
  const d = await parseBody(req, categorySchema);
  const id = (await ctx.params).id;
  const c = await db.destinationCategory.update({ where: { id }, data: { name: d.name, slug: slugify(d.name), description: d.description, sortOrder: d.sortOrder } });
  await audit(user.id, "CATEGORY_UPDATE", "DestinationCategory", id);
  return ok(c);
});

export const DELETE = route(async (_req, ctx) => {
  const user = await requireApiUser("category:manage");
  const id = (await ctx.params).id;
  const n = await db.destination.count({ where: { categoryId: id, deletedAt: null } });
  if (n > 0) throw new ApiError(409, `${n} destination(s) use this category. Reassign them first.`);
  await db.destinationCategory.delete({ where: { id } });
  await audit(user.id, "CATEGORY_DELETE", "DestinationCategory", id);
  return ok({ deleted: true });
});
