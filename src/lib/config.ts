/**
 * Temporary frontend-only deployment switch.
 * ENABLE_DATABASE=false  -> no Prisma queries are executed; public UI uses mock data (src/server/mock).
 * Anything else / unset  -> normal database-backed behaviour.
 */
export const DATABASE_ENABLED = process.env.ENABLE_DATABASE?.trim().toLowerCase() !== "false";

export class DatabaseDisabledError extends Error {
  status = 503;
  constructor() {
    super("The database is disabled (ENABLE_DATABASE=false). This feature is unavailable in frontend-only mode.");
    this.name = "DatabaseDisabledError";
  }
}
