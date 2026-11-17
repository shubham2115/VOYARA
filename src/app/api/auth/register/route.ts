import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ApiError, limit, ok, parseBody, route } from "@/lib/api";
import { registerSchema } from "@/lib/validators/auth";
import { audit } from "@/lib/audit";

export const POST = route(async (req) => {
  limit(req, "register", 5, 60 * 60_000);
  const data = await parseBody(req, registerSchema);
  const exists = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "An account with this email already exists");
  // role is NEVER read from the request: public registration always creates a CUSTOMER
  const user = await db.user.create({
    data: { name: data.name, email: data.email, phone: data.phone || null, passwordHash: await bcrypt.hash(data.password, 12), role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
  });
  await audit(user.id, "REGISTER", "User", user.id);
  return ok(user, { status: 201 });
});
