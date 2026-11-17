import { z } from "zod";
import { limit, ok, parseBody, route } from "@/lib/api";
import { applyCoupon } from "@/server/services/bookings";

/** Public helper: previews the discount for a code and amount (no usage is consumed). */
export const POST = route(async (req) => {
  limit(req, "coupon", 30, 60 * 60_000);
  const { code, amount } = await parseBody(req, z.object({ code: z.string().trim().min(1).max(30), amount: z.number().int().positive() }));
  const { discount } = await applyCoupon(code, amount);
  return ok({ discount, payable: amount - discount });
});
