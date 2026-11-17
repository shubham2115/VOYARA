import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { EnquiryStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import type { SessionUser } from "@/lib/session";
import type { z } from "zod";
import type { quotationSchema } from "@/lib/validators/enquiry";
import { emails, sendMail } from "@/server/integrations/email";
import { createBooking } from "./bookings";
import { formatINR } from "@/lib/utils";

/** Admins see everything; staff only enquiries assigned to them. Applied to EVERY query so ids cannot be guessed across scope. */
export const enquiryScope = (u: SessionUser): Prisma.EnquiryWhereInput =>
  can(u.role, "enquiry:read:all") ? { deletedAt: null } : can(u.role, "enquiry:read:assigned") ? { deletedAt: null, assignedToId: u.id } : { id: "__none__" };

export type EnquiryListFilters = { q?: string; status?: string; assigned?: string; sort?: string; page?: number; size?: number };

export async function listEnquiries(u: SessionUser, f: EnquiryListFilters) {
  const page = Math.max(1, f.page ?? 1);
  const size = Math.min(100, f.size ?? 15);
  const and: Prisma.EnquiryWhereInput[] = [enquiryScope(u)];
  if (f.status) and.push({ status: f.status as EnquiryStatus });
  if (f.assigned === "none") and.push({ assignedToId: null });
  else if (f.assigned) and.push({ assignedToId: f.assigned });
  if (f.q) and.push({ OR: [{ name: { contains: f.q, mode: "insensitive" } }, { email: { contains: f.q, mode: "insensitive" } }, { phone: { contains: f.q } }, { reference: { contains: f.q, mode: "insensitive" } }] });
  const where = { AND: and };
  const orderBy: Prisma.EnquiryOrderByWithRelationInput = f.sort === "oldest" ? { createdAt: "asc" } : f.sort === "travel" ? { travelDate: "asc" } : { createdAt: "desc" };
  const [items, total] = await Promise.all([
    db.enquiry.findMany({ where, orderBy, skip: (page - 1) * size, take: size, include: { package: { select: { name: true } }, destination: { select: { name: true } }, assignedTo: { select: { id: true, name: true } } } }),
    db.enquiry.count({ where }),
  ]);
  return { items, total, page, size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export const getEnquiryDetail = (u: SessionUser, id: string) =>
  db.enquiry.findFirst({
    where: { AND: [{ id }, enquiryScope(u)] },
    include: {
      package: { select: { id: true, name: true, price: true, discountedPrice: true } }, destination: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      activities: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
      quotations: { orderBy: { createdAt: "desc" }, include: { items: true } },
      booking: { select: { id: true, reference: true } },
    },
  });

async function mustGet(u: SessionUser, id: string) {
  const e = await db.enquiry.findFirst({ where: { AND: [{ id }, enquiryScope(u)] } });
  if (!e) throw new ApiError(404, "Enquiry not found");
  return e;
}

export async function updateEnquiryStatus(u: SessionUser, id: string, status: EnquiryStatus, detail?: string) {
  const e = await mustGet(u, id);
  if (e.status === status) return e;
  const [updated] = await db.$transaction([
    db.enquiry.update({ where: { id }, data: { status } }),
    db.enquiryActivity.create({ data: { enquiryId: id, actorId: u.id, type: "STATUS_CHANGED", fromStatus: e.status, toStatus: status, detail } }),
  ]);
  await audit(u.id, "ENQUIRY_STATUS", "Enquiry", id, { from: e.status, to: status });
  return updated;
}

export async function assignEnquiry(u: SessionUser, id: string, staffId: string | null) {
  if (!can(u.role, "enquiry:assign")) throw new ApiError(403, "Only administrators can assign enquiries");
  const e = await mustGet(u, id);
  let name = "Unassigned";
  if (staffId) {
    const s = await db.user.findFirst({ where: { id: staffId, role: { in: ["STAFF", "ADMIN"] }, isActive: true, deletedAt: null } });
    if (!s) throw new ApiError(422, "Selected staff member is not available");
    name = s.name;
  }
  const status: EnquiryStatus = e.status === "NEW" && staffId ? "UNDER_REVIEW" : e.status;
  await db.$transaction([
    db.enquiry.update({ where: { id }, data: { assignedToId: staffId, status } }),
    db.enquiryActivity.create({ data: { enquiryId: id, actorId: u.id, type: "ASSIGNED", fromStatus: e.status, toStatus: status, detail: `Assigned to ${name}` } }),
  ]);
  await audit(u.id, "ENQUIRY_ASSIGN", "Enquiry", id, { staffId });
}

export async function addNote(u: SessionUser, id: string, d: { body: string; isCommunication: boolean; channel?: string }) {
  await mustGet(u, id);
  const note = await db.enquiryNote.create({ data: { enquiryId: id, authorId: u.id, body: d.body, isCommunication: d.isCommunication, channel: d.channel } });
  if (d.isCommunication) await db.enquiryActivity.create({ data: { enquiryId: id, actorId: u.id, type: "COMMUNICATION", detail: `${d.channel ?? "Contact"} logged` } });
  return note;
}

const qNumber = () => `QTN-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export async function createQuotation(u: SessionUser, id: string, d: z.infer<typeof quotationSchema>) {
  const e = await mustGet(u, id);
  const subtotal = d.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  if (d.discount > subtotal) throw new ApiError(422, "Discount cannot exceed the subtotal");
  const total = Math.round((subtotal - d.discount) * (1 + d.taxPercent / 100));
  const q = await db.quotation.create({
    data: { number: qNumber(), enquiryId: id, title: d.title, subtotal, discount: d.discount, taxPercent: d.taxPercent, total, validUntil: d.validUntil, terms: d.terms, status: d.send ? "SENT" : "DRAFT", sentAt: d.send ? new Date() : null, items: { create: d.items } },
  });
  await db.enquiryActivity.create({ data: { enquiryId: id, actorId: u.id, type: d.send ? "QUOTATION_SENT" : "QUOTATION_DRAFTED", fromStatus: e.status, toStatus: d.send ? "QUOTATION_SENT" : e.status, detail: `${q.number} · ${formatINR(total)}` } });
  if (d.send) {
    await db.enquiry.update({ where: { id }, data: { status: "QUOTATION_SENT" } });
    void sendMail({ to: e.email, subject: `Your Voyara quotation ${q.number}`, html: emails.quotationSent(e.name, e.reference, q.number, formatINR(total)) });
  }
  await audit(u.id, "QUOTATION_CREATE", "Quotation", q.id, { total, sent: d.send });
  return q;
}

export async function sendQuotation(u: SessionUser, enquiryId: string, quotationId: string) {
  const e = await mustGet(u, enquiryId);
  const q = await db.quotation.findFirst({ where: { id: quotationId, enquiryId } });
  if (!q) throw new ApiError(404, "Quotation not found");
  await db.quotation.update({ where: { id: q.id }, data: { status: "SENT", sentAt: new Date() } });
  await db.enquiry.update({ where: { id: enquiryId }, data: { status: "QUOTATION_SENT" } });
  await db.enquiryActivity.create({ data: { enquiryId, actorId: u.id, type: "QUOTATION_SENT", fromStatus: e.status, toStatus: "QUOTATION_SENT", detail: q.number } });
  void sendMail({ to: e.email, subject: `Your Voyara quotation ${q.number}`, html: emails.quotationSent(e.name, e.reference, q.number, formatINR(q.total)) });
}

/** Converts an enquiry into a booking. Creates a customer account for guests (password set via "forgot password"). */
export async function convertToBooking(u: SessionUser, id: string, d: { totalAmount?: number; travelDate?: Date; couponCode?: string }) {
  const e = await mustGet(u, id);
  if (!can(u.role, "booking:manage")) throw new ApiError(403, "Not allowed");
  const quote = await db.quotation.findFirst({ where: { enquiryId: id, status: { in: ["SENT", "APPROVED"] } }, orderBy: { createdAt: "desc" } });
  const pkg = e.packageId ? await db.tourPackage.findUnique({ where: { id: e.packageId } }) : null;
  const total = d.totalAmount ?? quote?.total ?? (pkg ? (pkg.discountedPrice ?? pkg.price) * (e.adults + Math.ceil(e.children / 2)) : undefined);
  if (!total || total <= 0) throw new ApiError(422, "Provide a total amount (no quotation or package price available)");
  const travelDate = d.travelDate ?? e.travelDate;
  if (!travelDate) throw new ApiError(422, "A travel date is required");

  let userId = e.userId;
  if (!userId) {
    const existing = await db.user.findUnique({ where: { email: e.email } });
    userId = existing?.id ?? (await db.user.create({ data: { name: e.name, email: e.email, phone: e.phone, passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12), role: "CUSTOMER" } })).id;
    await db.enquiry.update({ where: { id }, data: { userId } });
  }
  if (quote) await db.quotation.update({ where: { id: quote.id }, data: { status: "APPROVED" } });
  return createBooking({ userId, packageId: e.packageId, enquiryId: id, travelDate, adults: e.adults, children: e.children, rooms: e.rooms, totalAmount: total, couponCode: d.couponCode ?? e.couponCode, assignedToId: e.assignedToId ?? (u.role === "STAFF" ? u.id : null) }, u.id);
}
