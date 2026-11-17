import { z } from "zod";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { convertToBooking } from "@/server/services/admin-enquiries";

const schema = z.object({ totalAmount: z.number().int().positive().optional(), travelDate: z.coerce.date().optional(), couponCode: z.string().max(30).optional() });

export const POST = route(async (req, ctx) => {
  const user = await requireApiUser("booking:manage");
  const d = await parseBody(req, schema);
  return ok(await convertToBooking(user, (await ctx.params).id, d), { status: 201 });
});
