import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { blogSchema } from "@/lib/validators/catalog";
import { saveBlog } from "@/server/services/admin-content";

export const GET = route(async () => {
  await requireApiUser("blog:manage");
  return ok(await db.blog.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { category: true } }));
});

export const POST = route(async (req) => {
  const user = await requireApiUser("blog:manage");
  return ok(await saveBlog(user.id, await parseBody(req, blogSchema)), { status: 201 });
});
