import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";

const schema = z.object({ bookingId: z.string().min(1), rating: z.number().int().min(1).max(5), title: z.string().trim().max(100).optional(), body: z.string().trim().min(10).max(2000) });

/** Only the booking owner can review, and only once the trip is COMPLETED (verified review). */
export const POST = route(async (req) => {
  const user = await requireApiUser();
  const d = await parseBody(req, schema);
  const booking = await db.booking.findFirst({ where: { id: d.bookingId, userId: user.id, deletedAt: null }, include: { package: { select: { id: true, destinationId: true } } } });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "COMPLETED") throw new ApiError(403, "You can review a trip once it is completed");
  const review = await db.review.create({
    data: { userId: user.id, bookingId: booking.id, packageId: booking.package?.id, destinationId: booking.package?.destinationId, rating: d.rating, title: d.title, body: d.body, status: "PENDING" },
  });
  return ok(review, { status: 201 });
});
