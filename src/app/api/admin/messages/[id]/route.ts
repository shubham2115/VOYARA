import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";

export const PUT = route(async (req, ctx) => {
  await requireApiUser("cms:manage");
  const { isRead } = await parseBody(req, z.object({ isRead: z.boolean() }));
  return ok(await db.contactMessage.update({ where: { id: (await ctx.params).id }, data: { isRead } }));
});
