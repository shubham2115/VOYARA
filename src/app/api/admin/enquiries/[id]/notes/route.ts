import { ok, parseBody, route } from "@/lib/api";
import { requireApiUser } from "@/lib/session";
import { noteSchema } from "@/lib/validators/enquiry";
import { addNote } from "@/server/services/admin-enquiries";

export const POST = route(async (req, ctx) => {
  const user = await requireApiUser("enquiry:update");
  const d = await parseBody(req, noteSchema);
  return ok(await addNote(user, (await ctx.params).id, d), { status: 201 });
});
