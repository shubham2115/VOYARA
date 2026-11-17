import crypto from "node:crypto";
import { db } from "@/lib/db";
import { limit, ok, parseBody, route } from "@/lib/api";
import { forgotSchema } from "@/lib/validators/auth";
import { emails, sendMail } from "@/server/integrations/email";

const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export const POST = route(async (req) => {
  limit(req, "forgot", 5, 60 * 60_000);
  const { email } = await parseBody(req, forgotSchema);
  const user = await db.user.findUnique({ where: { email } });
  if (user && user.isActive && !user.deletedAt) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60_000) },
    });
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await sendMail({ to: user.email, subject: "Reset your Voyara password", html: emails.resetPassword(user.name, `${base}/reset-password?token=${token}`) });
  }
  // Always the same response so accounts cannot be enumerated
  return ok({ message: "If that email is registered, a reset link has been sent." });
});
