import type { NextAuthConfig } from "next-auth";

/** Edge-safe config (no Prisma / bcrypt) used by middleware. Middleware is only a coarse guard;
 *  real authorization is re-checked server-side against the DB (see lib/session.ts). */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      const p = nextUrl.pathname;
      if (p.startsWith("/admin")) return role === "ADMIN" || role === "STAFF";
      if (p.startsWith("/account")) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as "CUSTOMER" | "STAFF" | "ADMIN";
      return session;
    },
  },
} satisfies NextAuthConfig;
