import type { Prisma } from "@prisma/client";
import { db } from "./db";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue,
  ip?: string,
) {
  try {
    await db.auditLog.create({ data: { actorId, action, entity, entityId, metadata, ip } });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
