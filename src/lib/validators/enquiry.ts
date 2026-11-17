import { z } from "zod";
import { phoneSchema } from "./auth";

const optDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));

export const enquirySchema = z.object({
  source: z.enum(["PACKAGE_BOOKING", "CUSTOM_TRIP", "CONTACT", "AI_PLANNER"]).default("PACKAGE_BOOKING"),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: phoneSchema,
  packageId: z.string().min(1).max(40).optional(),
  destinationId: z.string().min(1).max(40).optional(),
  destinationName: z.string().trim().max(120).optional(),
  departureCity: z.string().trim().max(80).optional(),
  travelDate: optDate,
  returnDate: optDate,
  adults: z.coerce.number().int().min(1).max(30).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0),
  rooms: z.coerce.number().int().min(1).max(15).default(1),
  budgetPerPerson: z.coerce.number().int().min(0).max(10_000_000).optional(),
  hotelPreference: z.string().trim().max(60).optional(),
  transportPreference: z.string().trim().max(60).optional(),
  interests: z.array(z.string().trim().max(40)).max(15).default([]),
  message: z.string().trim().max(2000).optional(),
  couponCode: z.string().trim().max(30).optional(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const ENQUIRY_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "CONTACTED",
  "QUOTATION_SENT",
  "CUSTOMER_APPROVED",
  "BOOKING_CONFIRMED",
  "CANCELLED",
  "CLOSED",
] as const;
export const enquiryStatusSchema = z.enum(ENQUIRY_STATUSES);
export const enquiryUpdateSchema = z.object({
  status: enquiryStatusSchema.optional(),
  detail: z.string().max(500).optional(),
});
export const noteSchema = z.object({
  body: z.string().trim().min(1).max(3000),
  isCommunication: z.boolean().default(false),
  channel: z.enum(["CALL", "EMAIL", "WHATSAPP", "MEETING"]).optional(),
});
export const assignSchema = z.object({ staffId: z.string().min(1).nullable() });

export const quotationSchema = z.object({
  title: z.string().trim().min(3).max(150),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        quantity: z.coerce.number().int().min(1).max(100),
        unitPrice: z.coerce.number().int().min(0),
      }),
    )
    .min(1)
    .max(30),
  discount: z.coerce.number().int().min(0).default(0),
  taxPercent: z.coerce.number().min(0).max(28).default(5),
  validUntil: optDate,
  terms: z.string().max(3000).optional(),
  send: z.boolean().default(false),
});
