import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("coupon:manage");
  const d = await parseBody(req, z.object({ isActive: z.boolean().optional(), showOnHome: z.boolean().optional() }));
  const id = (await ctx.params).id;
  const c = await db.coupon.update({ where: { id }, data: d });
  await audit(user.id, "COUPON_UPDATE", "Coupon", id, d);
  return ok(c);
});

export const DELETE = route(async (_req, ctx) => {
  const user = await requireApiUser("coupon:manage");
  const id = (await ctx.params).id;
  // Used coupons are deactivated rather than deleted to keep booking history intact
  const used = await db.booking.count({ where: { couponId: id } });
  if (used > 0) await db.coupon.update({ where: { id }, data: { isActive: false } });
  else await db.coupon.delete({ where: { id } });
  await audit(user.id, "COUPON_DELETE", "Coupon", id, { deactivatedOnly: used > 0 });
  return ok({ deleted: used === 0, deactivated: used > 0 });
});
