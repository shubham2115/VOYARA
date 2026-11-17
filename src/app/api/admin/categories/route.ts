import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { categorySchema } from "@/lib/validators/catalog";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";

export const GET = route(async () => {
  await requireApiUser("category:manage");
  return ok(await db.destinationCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { destinations: true } } } }));
});

export const POST = route(async (req) => {
  const user = await requireApiUser("category:manage");
  const d = await parseBody(req, categorySchema);
  const c = await db.destinationCategory.create({ data: { name: d.name, slug: slugify(d.name), description: d.description, sortOrder: d.sortOrder } });
  await audit(user.id, "CATEGORY_CREATE", "DestinationCategory", c.id);
  return ok(c, { status: 201 });
});
