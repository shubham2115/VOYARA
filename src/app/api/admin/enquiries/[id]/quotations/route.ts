import { z } from "zod";
import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { quotationSchema } from "@/lib/validators/enquiry";
import { createQuotation, sendQuotation } from "@/server/services/admin-enquiries";

export const POST = route(async (req, ctx) => {
  const user = await requireApiUser("quotation:manage");
  const d = await parseBody(req, quotationSchema);
  return ok(await createQuotation(user, (await ctx.params).id, d), { status: 201 });
});

/** Re-send an existing draft/sent quotation by email. */
export const PUT = route(async (req, ctx) => {
  const user = await requireApiUser("quotation:manage");
  const { quotationId } = await parseBody(req, z.object({ quotationId: z.string().min(1) }));
  await sendQuotation(user, (await ctx.params).id, quotationId);
  return ok({ sent: true });
});
