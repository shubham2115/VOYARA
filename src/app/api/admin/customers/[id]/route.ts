import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const PUT = route(async (req, ctx) => {
  const admin = await requireApiUser("customer:manage");
  const { isActive } = await parseBody(req, z.object({ isActive: z.boolean() }));
  const id = (await ctx.params).id;
  const target = await db.user.findFirst({ where: { id, role: "CUSTOMER", deletedAt: null } });
  if (!target) throw new ApiError(404, "Customer not found");
  const u = await db.user.update({ where: { id }, data: { isActive }, select: { id: true, isActive: true } });
  await audit(admin.id, isActive ? "CUSTOMER_ACTIVATE" : "CUSTOMER_DEACTIVATE", "User", id);
  return ok(u);
});
