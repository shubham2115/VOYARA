import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, limit, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { createRazorpayOrder, razorpayConfigured } from "@/server/integrations/razorpay";

const schema = z.object({ bookingId: z.string().min(1), amount: z.number().int().positive() });

/** Customer starts an online payment for their own booking. Amount is validated against the balance due server-side. */
export const POST = route(async (req) => {
  const user = await requireApiUser();
  limit(req, "pay-order", 20, 60 * 60_000, user.id);
  if (!razorpayConfigured()) throw new ApiError(503, "Online payments are not configured. Please contact us to pay by bank transfer or UPI.");
  const { bookingId, amount } = await parseBody(req, schema);
  const booking = await db.booking.findFirst({ where: { id: bookingId, userId: user.id, deletedAt: null } });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "CANCELLED") throw new ApiError(409, "Booking is cancelled");
  const due = booking.totalAmount - booking.amountPaid;
  if (amount > due) throw new ApiError(422, `Amount exceeds balance due (${due})`);
  const order = await createRazorpayOrder(amount, booking.reference);
  await db.payment.create({ data: { bookingId, amount, method: "RAZORPAY", status: "CREATED", razorpayOrderId: order.id } });
  return ok({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
});
