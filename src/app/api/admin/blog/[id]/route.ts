import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { blogSchema } from "@/lib/validators/catalog";
import { saveBlog } from "@/server/services/admin-content";
import { audit } from "@/lib/audit";

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("blog:manage");
  return ok(await saveBlog(user.id, await parseBody(req, blogSchema), (await ctx.params).id));
});

export const DELETE = route(async (_req, ctx) => {
  const user = await requireApiUser("blog:manage");
  const id = (await ctx.params).id;
  await db.blog.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
  await audit(user.id, "BLOG_DELETE", "Blog", id);
  return ok({ deleted: true });
});
