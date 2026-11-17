import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ApiError, limit, ok, parseBody, route } from "@/lib/api";
import { resetSchema } from "@/lib/validators/auth";
import { audit } from "@/lib/audit";

export const POST = route(async (req) => {
  limit(req, "reset", 10, 60 * 60_000);
  const { token, password } = await parseBody(req, resetSchema);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const rec = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) throw new ApiError(400, "This reset link is invalid or has expired");
  await db.$transaction([
    db.user.update({ where: { id: rec.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    db.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
  await audit(rec.userId, "PASSWORD_RESET", "User", rec.userId);
  return ok({ message: "Password updated. You can now sign in." });
});
