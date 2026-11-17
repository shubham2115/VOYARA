import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { BookingStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import type { SessionUser } from "@/lib/session";
import { phoneSchema } from "@/lib/validators/auth";
import { createBooking } from "./bookings";

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "PAYMENT_PENDING", "PARTIALLY_PAID", "FULLY_PAID", "COMPLETED", "CANCELLED"] as const;

export const bookingScope = (u: SessionUser): Prisma.BookingWhereInput =>
  can(u.role, "booking:read:all") ? { deletedAt: null } : can(u.role, "booking:read:assigned") ? { deletedAt: null, assignedToId: u.id } : { id: "__none__" };

export const manualBookingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: phoneSchema,
  packageId: z.string().min(1).optional(),
  travelDate: z.coerce.date(),
  adults: z.number().int().min(1).max(30),
  children: z.number().int().min(0).max(20).default(0),
  rooms: z.number().int().min(1).max(15).default(1),
  totalAmount: z.number().int().positive(),
  couponCode: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});
export const bookingUpdateSchema = z.object({ status: z.enum(BOOKING_STATUSES).optional(), assignedToId: z.string().min(1).nullable().optional(), notes: z.string().max(1000).nullable().optional() });
export const paymentSchema = z.object({ amount: z.number().int().positive(), method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CARD", "OTHER"]), reference: z.string().trim().max(100).optional() });

export type BookingFilters = { q?: string; status?: string; sort?: string; page?: number; size?: number };

export async function listBookings(u: SessionUser, f: BookingFilters) {
  const page = Math.max(1, f.page ?? 1);
  const size = Math.min(100, f.size ?? 15);
  const and: Prisma.BookingWhereInput[] = [bookingScope(u)];
  if (f.status) and.push({ status: f.status as BookingStatus });
  if (f.q) and.push({ OR: [{ reference: { contains: f.q, mode: "insensitive" } }, { user: { name: { contains: f.q, mode: "insensitive" } } }, { user: { email: { contains: f.q, mode: "insensitive" } } }] });
  const orderBy: Prisma.BookingOrderByWithRelationInput = f.sort === "travel" ? { travelDate: "asc" } : f.sort === "amount" ? { totalAmount: "desc" } : { createdAt: "desc" };
  const where = { AND: and };
  const [items, total] = await Promise.all([
    db.booking.findMany({ where, orderBy, skip: (page - 1) * size, take: size, include: { user: { select: { name: true, email: true } }, package: { select: { name: true } }, assignedTo: { select: { name: true } } } }),
    db.booking.count({ where }),
  ]);
  return { items, total, page, size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export const getBookingDetail = (u: SessionUser, id: string) =>
  db.booking.findFirst({
    where: { AND: [{ id }, bookingScope(u)] },
    include: { user: { select: { id: true, name: true, email: true, phone: true } }, package: { select: { name: true, slug: true } }, assignedTo: { select: { id: true, name: true } }, payments: { where: { status: "PAID" }, orderBy: { paidAt: "desc" } }, enquiry: { select: { id: true, reference: true } }, coupon: { select: { code: true } } },
  });

export async function createManualBooking(u: SessionUser, d: z.infer<typeof manualBookingSchema>) {
  let user = await db.user.findUnique({ where: { email: d.email } });
  if (!user) user = await db.user.create({ data: { name: d.name, email: d.email, phone: d.phone, passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12), role: "CUSTOMER" } });
  else if (user.role !== "CUSTOMER") throw Object.assign(new Error("That email belongs to a staff account"), { status: 422 });
  return createBooking({ userId: user.id, packageId: d.packageId, travelDate: d.travelDate, adults: d.adults, children: d.children, rooms: d.rooms, totalAmount: d.totalAmount, couponCode: d.couponCode, notes: d.notes, assignedToId: u.role === "STAFF" ? u.id : null }, u.id);
}
