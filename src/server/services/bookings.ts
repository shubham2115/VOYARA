import "server-only";
import crypto from "node:crypto";
import type { BookingStatus, PaymentMethod, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { emails, sendMail } from "@/server/integrations/email";

const bookingRef = () => `BKG-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

/** Payment-derived status. Terminal / manual states (COMPLETED, CANCELLED) are never overwritten here. */
export function statusFromPayment(current: BookingStatus, total: number, paid: number): BookingStatus {
  if (current === "COMPLETED" || current === "CANCELLED") return current;
  if (paid >= total && total > 0) return "FULLY_PAID";
  if (paid > 0) return "PARTIALLY_PAID";
  return current === "FULLY_PAID" || current === "PARTIALLY_PAID" ? "PAYMENT_PENDING" : current;
}

export async function applyCoupon(code: string | null | undefined, amount: number) {
  if (!code) return { couponId: null as string | null, discount: 0 };
  const c = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  const now = new Date();
  if (!c || !c.isActive || (c.validFrom && c.validFrom > now) || (c.validUntil && c.validUntil < now) || (c.usageLimit != null && c.usedCount >= c.usageLimit) || amount < c.minAmount)
    throw new ApiError(422, "Coupon is invalid, expired or not applicable to this amount");
  let d = c.discountType === "PERCENT" ? Math.round((amount * c.value) / 100) : c.value;
  if (c.maxDiscount != null) d = Math.min(d, c.maxDiscount);
  return { couponId: c.id, discount: Math.min(d, amount) };
}

export type NewBooking = {
  userId: string; packageId?: string | null; enquiryId?: string | null; travelDate: Date; adults: number; children: number; rooms: number;
  totalAmount: number; couponCode?: string | null; assignedToId?: string | null; notes?: string | null;
};

export async function createBooking(input: NewBooking, actorId: string) {
  const { couponId, discount } = await applyCoupon(input.couponCode, input.totalAmount);
  const booking = await db.$transaction(async (tx) => {
    if (input.enquiryId) {
      const existing = await tx.booking.findUnique({ where: { enquiryId: input.enquiryId } });
      if (existing) throw new ApiError(409, "This enquiry has already been converted to a booking");
    }
    if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    const b = await tx.booking.create({
      data: {
        reference: bookingRef(), status: "PENDING", userId: input.userId, packageId: input.packageId ?? null, enquiryId: input.enquiryId ?? null,
        travelDate: input.travelDate, adults: input.adults, children: input.children, rooms: input.rooms,
        totalAmount: input.totalAmount - discount, discountAmount: discount, couponId, assignedToId: input.assignedToId ?? null, notes: input.notes ?? null,
      },
    });
    if (input.enquiryId) {
      const enq = await tx.enquiry.findUnique({ where: { id: input.enquiryId }, select: { status: true } });
      await tx.enquiry.update({ where: { id: input.enquiryId }, data: { status: "BOOKING_CONFIRMED" } });
      await tx.enquiryActivity.create({ data: { enquiryId: input.enquiryId, actorId, type: "BOOKING_CREATED", fromStatus: enq?.status, toStatus: "BOOKING_CONFIRMED", detail: b.reference } });
    }
    return b;
  });
  await audit(actorId, "BOOKING_CREATE", "Booking", booking.id, { reference: booking.reference });
  return booking;
}

export async function updateBooking(id: string, actorId: string, patch: { status?: BookingStatus; assignedToId?: string | null; notes?: string | null }, scope?: Prisma.BookingWhereInput) {
  const existing = await db.booking.findFirst({ where: { id, deletedAt: null, ...scope }, include: { user: true } });
  if (!existing) throw new ApiError(404, "Booking not found");
  const data: Prisma.BookingUpdateInput = {};
  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "CONFIRMED") data.confirmedAt = new Date();
    if (patch.status === "CANCELLED") data.cancelledAt = new Date();
  }
  if (patch.assignedToId !== undefined) data.assignedTo = patch.assignedToId ? { connect: { id: patch.assignedToId } } : { disconnect: true };
  if (patch.notes !== undefined) data.notes = patch.notes;
  const updated = await db.booking.update({ where: { id }, data });
  await audit(actorId, "BOOKING_UPDATE", "Booking", id, JSON.parse(JSON.stringify(patch)));
  if (patch.status === "CONFIRMED" && existing.status !== "CONFIRMED")
    void sendMail({ to: existing.user.email, subject: `Booking ${existing.reference} confirmed`, html: emails.bookingConfirmed(existing.user.name, existing.reference) });
  return updated;
}

/** Records a successful payment and re-derives amountPaid + status in one transaction. */
export async function recordPayment(p: {
  bookingId: string; amount: number; method: PaymentMethod; reference?: string | null; actorId?: string | null;
  razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string; existingPaymentId?: string;
}) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: p.bookingId } });
    if (!booking || booking.deletedAt) throw new ApiError(404, "Booking not found");
    if (booking.status === "CANCELLED") throw new ApiError(409, "Cannot take payment on a cancelled booking");
    const due = booking.totalAmount - booking.amountPaid;
    if (p.amount <= 0 || p.amount > due) throw new ApiError(422, `Amount must be between 1 and the balance due (${due})`);
    const data = { bookingId: p.bookingId, amount: p.amount, method: p.method, status: "PAID" as const, paidAt: new Date(), reference: p.reference ?? null, recordedById: p.actorId ?? null, razorpayOrderId: p.razorpayOrderId, razorpayPaymentId: p.razorpayPaymentId, razorpaySignature: p.razorpaySignature };
    const payment = p.existingPaymentId
      ? await tx.payment.update({ where: { id: p.existingPaymentId }, data })
      : await tx.payment.create({ data });
    const paid = booking.amountPaid + p.amount;
    await tx.booking.update({ where: { id: booking.id }, data: { amountPaid: paid, status: statusFromPayment(booking.status, booking.totalAmount, paid) } });
    return payment;
  });
}
