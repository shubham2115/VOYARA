import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "./db";
import { ApiError } from "./api";
import { can, type Permission } from "./rbac";

export type SessionUser = { id: string; name: string; email: string; role: Role };

/** Authoritative current user: role and active flag are re-read from the DB, never from the client/JWT alone. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, deletedAt: true },
  });
  if (!u || !u.isActive || u.deletedAt) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

/** For pages / layouts: redirects when unauthenticated or lacking the permission. */
export async function requirePageUser(opts?: { permission?: Permission; roles?: Role[] }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (opts?.permission && !can(user.role, opts.permission)) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");
  if (opts?.roles && !opts.roles.includes(user.role)) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");
  return user;
}

/** For API routes: throws 401/403 ApiError. */
export async function requireApiUser(permission?: Permission | Permission[]) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Authentication required");
  if (permission) {
    const list = Array.isArray(permission) ? permission : [permission];
    if (!list.some((p) => can(user.role, p))) throw new ApiError(403, "You do not have permission to perform this action");
  }
  return user;
}
