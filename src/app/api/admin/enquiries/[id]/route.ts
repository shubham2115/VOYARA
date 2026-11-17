import { ApiError, ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { enquiryUpdateSchema } from "@/lib/validators/enquiry";
import { getEnquiryDetail, updateEnquiryStatus } from "@/server/services/admin-enquiries";

export const GET = route(async (_req, ctx) => {
  const user = await requireApiUser(["enquiry:read:all", "enquiry:read:assigned"]);
  const e = await getEnquiryDetail(user, (await ctx.params).id);
  if (!e) throw new ApiError(404, "Enquiry not found");
  return ok(e);
});

export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("enquiry:update");
  const d = await parseBody(req, enquiryUpdateSchema);
  if (!d.status) throw new ApiError(422, "status is required");
  return ok(await updateEnquiryStatus(user, (await ctx.params).id, d.status, d.detail));
});
