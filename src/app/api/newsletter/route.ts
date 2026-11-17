import { z } from "zod";
import { db } from "@/lib/db";
import { limit, ok, parseBody, route } from "@/lib/api";

export const POST = route(async (req) => {
  limit(req, "newsletter", 5, 60 * 60_000);
  const { email } = await parseBody(req, z.object({ email: z.string().trim().toLowerCase().email() }));
  await db.newsletterSubscription.upsert({ where: { email }, update: { isActive: true }, create: { email } });
  return ok({ subscribed: true }, { status: 201 });
});
