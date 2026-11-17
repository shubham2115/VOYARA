import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createEnquiry } from "@/server/services/enquiries";
import { assignEnquiry, convertToBooking, createQuotation, enquiryScope, getEnquiryDetail, updateEnquiryStatus } from "@/server/services/admin-enquiries";
import { recordPayment } from "@/server/services/bookings";
import { enquirySchema } from "@/lib/validators/enquiry";
import type { SessionUser } from "@/lib/session";

/** Integration test against the real database. Skipped automatically when no DB is reachable. */
let dbUp = false;
const tag = `it-${Date.now()}`;
let admin: SessionUser, staffA: SessionUser, staffB: SessionUser;

beforeAll(async () => {
  try { await db.$queryRaw`SELECT 1`; dbUp = true; } catch { return; }
  const mk = (role: "ADMIN" | "STAFF", n: string) => db.user.create({ data: { name: n, email: `${tag}-${n}@test.local`, passwordHash: "x", role } });
  const [a, s1, s2] = await Promise.all([mk("ADMIN", "admin"), mk("STAFF", "staffa"), mk("STAFF", "staffb")]);
  admin = { id: a.id, name: a.name, email: a.email, role: "ADMIN" };
  staffA = { id: s1.id, name: s1.name, email: s1.email, role: "STAFF" };
  staffB = { id: s2.id, name: s2.name, email: s2.email, role: "STAFF" };
});

afterAll(async () => {
  if (!dbUp) return;
  await db.payment.deleteMany({ where: { booking: { user: { email: { startsWith: tag } } } } });
  await db.booking.deleteMany({ where: { user: { email: { startsWith: tag } } } });
  await db.enquiry.deleteMany({ where: { email: { startsWith: tag } } });
  await db.user.deleteMany({ where: { email: { startsWith: tag } } });
  await db.$disconnect();
});

describe.skipIf(!process.env.DATABASE_URL)("enquiry → quotation → booking → payment", () => {
  it("runs the whole funnel with RBAC scoping", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const pkg = await db.tourPackage.findFirst({ where: { isPublished: true } });
    expect(pkg).toBeTruthy();

    // 1. public enquiry
    const input = enquirySchema.parse({ name: "Test Guest", email: `${tag}-guest@test.local`, phone: "+919876543210", packageId: pkg!.id, adults: 2, travelDate: "2030-01-15" });
    const enq = await createEnquiry(input, null);
    expect(enq.status).toBe("NEW");
    expect(enq.reference).toMatch(/^ENQ-\d{4}-[0-9A-F]{8}$/);

    // 2. staff cannot see unassigned enquiries; admin can
    expect(await getEnquiryDetail(staffA, enq.id)).toBeNull();
    expect(await getEnquiryDetail(admin, enq.id)).not.toBeNull();
    expect(enquiryScope(staffA)).toMatchObject({ assignedToId: staffA.id });

    // 3. only admins may assign; assignment moves NEW → UNDER_REVIEW
    await expect(assignEnquiry(staffA, enq.id, staffA.id)).rejects.toThrow();
    await assignEnquiry(admin, enq.id, staffA.id);
    expect((await getEnquiryDetail(staffA, enq.id))?.status).toBe("UNDER_REVIEW");
    // ...and staff B still cannot see or modify it
    expect(await getEnquiryDetail(staffB, enq.id)).toBeNull();
    await expect(updateEnquiryStatus(staffB, enq.id, "CONTACTED")).rejects.toThrow();

    // 4. assigned staff updates status and sends quotation
    await updateEnquiryStatus(staffA, enq.id, "CONTACTED");
    const q = await createQuotation(staffA, enq.id, { title: "Quote", items: [{ description: "Package", quantity: 2, unitPrice: 10000 }], discount: 0, taxPercent: 5, send: true });
    expect(q.total).toBe(21000);
    expect((await getEnquiryDetail(admin, enq.id))?.status).toBe("QUOTATION_SENT");

    // 5. convert → booking exactly once, guest account created
    const booking = await convertToBooking(staffA, enq.id, {});
    expect(booking.totalAmount).toBe(21000);
    expect(booking.status).toBe("PENDING");
    await expect(convertToBooking(staffA, enq.id, {})).rejects.toThrow(/already/);
    expect((await getEnquiryDetail(admin, enq.id))?.status).toBe("BOOKING_CONFIRMED");

    // 6. payments: partial → full, over-payment rejected
    await recordPayment({ bookingId: booking.id, amount: 5000, method: "UPI", actorId: staffA.id });
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("PARTIALLY_PAID");
    await expect(recordPayment({ bookingId: booking.id, amount: 99999, method: "CASH" })).rejects.toThrow();
    await recordPayment({ bookingId: booking.id, amount: 16000, method: "BANK_TRANSFER" });
    const final = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(final.status).toBe("FULLY_PAID");
    expect(final.amountPaid).toBe(21000);
  });
});
