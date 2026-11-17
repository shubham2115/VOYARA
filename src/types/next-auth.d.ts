import type { DefaultSession } from "next-auth";

type AppRole = "CUSTOMER" | "STAFF" | "ADMIN";

declare module "next-auth" {
  interface User {
    role?: AppRole;
  }
  interface Session {
    user: { id: string; role: AppRole } & DefaultSession["user"];
  }
}
