import { getCurrentUser } from "@/lib/session";
import { limit, ok, parseBody, route } from "@/lib/api";
import { enquirySchema } from "@/lib/validators/enquiry";
import { createEnquiry } from "@/server/services/enquiries";

export const POST = route(async (req) => {
  limit(req, "enquiry", 8, 60 * 60_000);
  const data = await parseBody(req, enquirySchema);
  const user = await getCurrentUser();
  const enquiry = await createEnquiry(data, user?.id ?? null);
  return ok({ id: enquiry.id, reference: enquiry.reference }, { status: 201 });
});
