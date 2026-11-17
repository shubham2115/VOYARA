import { db } from "@/lib/db";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { couponSchema } from "@/lib/validators/catalog";
import { audit } from "@/lib/audit";

export const GET = route(async () => {
  await requireApiUser("coupon:manage");
  return ok(await db.coupon.findMany({ orderBy: { createdAt: "desc" } }));
});

export const POST = route(async (req) => {
  const user = await requireApiUser("coupon:manage");
  const c = await db.coupon.create({ data: await parseBody(req, couponSchema) });
  await audit(user.id, "COUPON_CREATE", "Coupon", c.id);
  return ok(c, { status: 201 });
});
