import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { bookingScope, paymentSchema } from "@/server/services/admin-bookings";
import { recordPayment } from "@/server/services/bookings";

/** Record an offline payment (cash / bank / UPI). Online payments only come through the verified Razorpay flow. */
export const POST = route(async (req, ctx) => {
  const user = await requireApiUser("payment:manage");
  const id = (await ctx.params).id;
  const visible = await db.booking.findFirst({ where: { AND: [{ id }, bookingScope(user)] }, select: { id: true } });
  if (!visible) throw new ApiError(404, "Booking not found");
  const d = await parseBody(req, paymentSchema);
  const p = await recordPayment({ bookingId: id, amount: d.amount, method: d.method, reference: d.reference, actorId: user.id });
  await audit(user.id, "PAYMENT_RECORDED", "Payment", p.id, { amount: d.amount, method: d.method });
  return ok(p, { status: 201 });
});
