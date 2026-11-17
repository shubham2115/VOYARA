import { z } from "zod";
import { db } from "@/lib/db";
import { limit, ok, parseBody, route } from "@/lib/api";
import { phoneSchema } from "@/lib/validators/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: phoneSchema.optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
});

export const POST = route(async (req) => {
  limit(req, "contact", 5, 60 * 60_000);
  const d = await parseBody(req, schema);
  await db.contactMessage.create({ data: { ...d, phone: d.phone || null } });
  await db.notification.create({ data: { type: "CONTACT_NEW", title: `Contact message: ${d.subject}`, body: `${d.name} <${d.email}>`, link: "/admin/messages" } });
  return ok({ received: true }, { status: 201 });
});
