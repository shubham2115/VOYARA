import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { updateBooking } from "@/server/services/bookings";
import { bookingScope, bookingUpdateSchema, getBookingDetail } from "@/server/services/admin-bookings";

export const GET = route(async (_req, ctx) => {
  const user = await requireApiUser(["booking:read:all", "booking:read:assigned"]);
  const b = await getBookingDetail(user, (await ctx.params).id);
  if (!b) throw new ApiError(404, "Booking not found");
  return ok(b);
});

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("booking:manage");
  const d = await parseBody(req, bookingUpdateSchema);
  // Only administrators may reassign bookings
  if (d.assignedToId !== undefined && !can(user.role, "enquiry:assign")) throw new ApiError(403, "Only administrators can assign bookings");
  return ok(await updateBooking((await ctx.params).id, user.id, d, bookingScope(user)));
});
