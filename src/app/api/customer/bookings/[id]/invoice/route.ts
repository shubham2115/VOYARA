import { db } from "@/lib/db";
import { ApiError, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { invoicePdf, pdfResponse } from "@/server/integrations/pdf";

export const runtime = "nodejs";

/** Owner, or staff/admin with booking access, may download the invoice. */
export const GET = route(async (_req, ctx) => {
  const user = await requireApiUser();
  const id = (await ctx.params).id;
  const b = await db.booking.findFirst({
    where: {
      id, deletedAt: null,
      ...(can(user.role, "booking:read:all") ? {} : can(user.role, "booking:read:assigned") ? { OR: [{ userId: user.id }, { assignedToId: user.id }] } : { userId: user.id }),
    },
    include: { user: true, package: { select: { name: true } }, payments: { where: { status: "PAID" } } },
  });
  if (!b) throw new ApiError(404, "Booking not found");
  const buf = await invoicePdf({
    reference: b.reference, issuedAt: new Date(), status: b.status, customer: { name: b.user.name, email: b.user.email, phone: b.user.phone },
    packageName: b.package?.name ?? "Custom trip", travelDate: b.travelDate, adults: b.adults, children: b.children,
    totalAmount: b.totalAmount, discountAmount: b.discountAmount, amountPaid: b.amountPaid, payments: b.payments,
  });
  return pdfResponse(buf, `invoice-${b.reference}.pdf`);
});
