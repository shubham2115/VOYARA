import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { loginSchema } from "./lib/validators/auth";
import { rateLimit } from "./lib/rate-limit";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

// Constant-time-ish decoy so unknown emails cost the same as wrong passwords
const DECOY = bcrypt.hashSync("decoy-password", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        if (!rateLimit(`login:${email}`, 8, 15 * 60_000).ok) throw new RateLimited();
        const user = await db.user.findUnique({ where: { email } });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DECOY);
        if (!user || !valid || !user.isActive || user.deletedAt) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
