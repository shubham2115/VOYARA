import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, limit, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { verifyRazorpaySignature } from "@/server/integrations/razorpay";
import { recordPayment } from "@/server/services/bookings";
import { audit } from "@/lib/audit";

const schema = z.object({ razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1) });

/** A payment is only marked PAID after the HMAC signature verifies against our server-side secret. */
export const POST = route(async (req) => {
  const user = await requireApiUser();
  limit(req, "pay-verify", 30, 60 * 60_000, user.id);
  const b = await parseBody(req, schema);
  const payment = await db.payment.findUnique({ where: { razorpayOrderId: b.razorpay_order_id }, include: { booking: true } });
  if (!payment || payment.booking.userId !== user.id) throw new ApiError(404, "Payment not found");
  if (payment.status === "PAID") return ok({ status: "PAID" });
  if (!verifyRazorpaySignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await audit(user.id, "PAYMENT_SIGNATURE_INVALID", "Payment", payment.id);
    throw new ApiError(400, "Payment verification failed");
  }
  await recordPayment({ bookingId: payment.bookingId, amount: payment.amount, method: "RAZORPAY", existingPaymentId: payment.id, razorpayOrderId: b.razorpay_order_id, razorpayPaymentId: b.razorpay_payment_id, razorpaySignature: b.razorpay_signature, actorId: user.id });
  await audit(user.id, "PAYMENT_VERIFIED", "Payment", payment.id, { amount: payment.amount });
  return ok({ status: "PAID" });
});
