import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { assignSchema } from "@/lib/validators/enquiry";
import { assignEnquiry } from "@/server/services/admin-enquiries";

export const POST = route(async (req, ctx) => {
  const user = await requireApiUser("enquiry:assign");
  const { staffId } = await parseBody(req, assignSchema);
  await assignEnquiry(user, (await ctx.params).id, staffId);
  return ok({ assigned: true });
});
