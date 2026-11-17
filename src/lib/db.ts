import { PrismaClient } from "@prisma/client";
import { DATABASE_ENABLED, DatabaseDisabledError } from "./config";

const g = globalThis as unknown as { prisma?: PrismaClient };

/** When ENABLE_DATABASE=false no PrismaClient is created; any accidental use throws a clear error instead of connecting. */
const disabled = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    if (prop === "then") return undefined; // not thenable
    throw new DatabaseDisabledError();
  },
});

export const db: PrismaClient = !DATABASE_ENABLED
  ? disabled
  : (g.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] }));
if (DATABASE_ENABLED && process.env.NODE_ENV !== "production") g.prisma = db;
