import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const schema = z.object({ isActive: z.boolean().optional(), role: z.enum(["STAFF", "ADMIN"]).optional() });

export const PUT = route(async (req, ctx) => {
  const admin = await requireApiUser("staff:manage");
  const id = (await ctx.params).id;
  const d = await parseBody(req, schema);
  if (id === admin.id) throw new ApiError(422, "You cannot change your own role or active status");
  const target = await db.user.findFirst({ where: { id, role: { in: ["STAFF", "ADMIN"] }, deletedAt: null } });
  if (!target) throw new ApiError(404, "Staff member not found");
  const u = await db.user.update({ where: { id }, data: d, select: { id: true, role: true, isActive: true } });
  await audit(admin.id, "STAFF_UPDATE", "User", id, d);
  return ok(u);
});
