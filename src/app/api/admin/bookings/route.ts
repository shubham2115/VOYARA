import { ApiError, ok, pageMeta, pageParams, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { createManualBooking, listBookings, manualBookingSchema } from "@/server/services/admin-bookings";

export const GET = route(async (req) => {
  const user = await requireApiUser(["booking:read:all", "booking:read:assigned"]);
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, size } = pageParams(url, { size: 15, max: 100 });
  const r = await listBookings(user, { q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, sort: sp.get("sort") ?? undefined, page, size });
  return ok(r.items, { meta: pageMeta(r.total, page, size) });
});

export const POST = route(async (req) => {
  const user = await requireApiUser("booking:manage");
  const d = await parseBody(req, manualBookingSchema);
  try {
    return ok(await createManualBooking(user, d), { status: 201 });
  } catch (e) {
    if (e instanceof Error && (e as { status?: number }).status === 422) throw new ApiError(422, e.message);
    throw e;
  }
});
