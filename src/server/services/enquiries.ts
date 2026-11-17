import "server-only";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { EnquiryInput } from "@/lib/validators/enquiry";
import { emails, sendMail } from "@/server/integrations/email";

const ref = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

/** Creates an enquiry (public or signed-in), writes the timeline entry, notifies admins and emails the customer. */
export async function createEnquiry(input: EnquiryInput, userId: string | null) {
  let destinationId = input.destinationId;
  let packageId = input.packageId;

  if (packageId) {
    const pkg = await db.tourPackage.findFirst({ where: { id: packageId, deletedAt: null }, select: { destinationId: true } });
    if (!pkg) packageId = undefined;
    else destinationId ??= pkg.destinationId;
  }
  if (!destinationId && input.destinationName) {
    const d = await db.destination.findFirst({ where: { name: { equals: input.destinationName, mode: "insensitive" } }, select: { id: true } });
    destinationId = d?.id;
  }

  const { destinationName, ...rest } = input;
  const message = [rest.message, destinationName && !destinationId ? `Requested destination: ${destinationName}` : null].filter(Boolean).join("\n") || null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const enquiry = await db.enquiry.create({
        data: {
          reference: ref("ENQ"),
          source: rest.source,
          userId,
          name: rest.name,
          email: rest.email,
          phone: rest.phone,
          packageId,
          destinationId,
          departureCity: rest.departureCity,
          travelDate: rest.travelDate,
          returnDate: rest.returnDate,
          adults: rest.adults,
          children: rest.children,
          rooms: rest.rooms,
          budgetPerPerson: rest.budgetPerPerson,
          hotelPreference: rest.hotelPreference,
          transportPreference: rest.transportPreference,
          interests: rest.interests,
          couponCode: rest.couponCode?.toUpperCase(),
          message,
          activities: { create: { type: "CREATED", toStatus: "NEW", detail: `Submitted via ${rest.source}` } },
        },
      });
      await db.notification.create({
        data: { type: "ENQUIRY_NEW", title: `New enquiry ${enquiry.reference}`, body: `${enquiry.name} · ${enquiry.phone}`, link: `/admin/enquiries/${enquiry.id}` },
      });
      void sendMail({ to: enquiry.email, subject: `We received your enquiry ${enquiry.reference}`, html: emails.enquiryReceived(enquiry.name, enquiry.reference) });
      return enquiry;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 2) continue;
      throw e;
    }
  }
  throw new Error("Could not allocate enquiry reference");
}
