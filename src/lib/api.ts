import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { Prisma } from "@prisma/client";
import { clientIp, rateLimit } from "./rate-limit";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: { status?: number; meta?: unknown }) =>
  NextResponse.json({ success: true, data, meta: init?.meta }, { status: init?.status ?? 200 });

export const fail = (status: number, message: string, details?: unknown) =>
  NextResponse.json({ success: false, error: { message, details } }, { status });

export function handleError(e: unknown) {
  if (e instanceof ApiError) return fail(e.status, e.message, e.details);
  if (e instanceof ZodError) return fail(422, "Validation failed", e.flatten().fieldErrors);
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return fail(409, "A record with these details already exists");
    if (e.code === "P2025") return fail(404, "Record not found");
  }
  console.error("[api]", e);
  return fail(500, "Something went wrong");
}

export type RouteCtx = { params: Promise<Record<string, string>> };

/** Wraps a route handler with uniform error handling. */
export const route =
  (fn: (req: Request, ctx: RouteCtx) => Promise<Response>) => async (req: Request, ctx: RouteCtx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return handleError(e);
    }
  };

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  return schema.parse(json);
}

export function limit(req: Request, bucket: string, max: number, windowMs: number, extra = "") {
  const r = rateLimit(`${bucket}:${clientIp(req)}:${extra}`, max, windowMs);
  if (!r.ok) throw new ApiError(429, `Too many requests. Try again in ${r.retryAfter}s.`);
}

export function pageParams(url: URL, defaults = { size: 12, max: 100 }) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const size = Math.min(defaults.max, Math.max(1, Number(url.searchParams.get("pageSize")) || defaults.size));
  return { page, size, skip: (page - 1) * size, take: size };
}

export const pageMeta = (total: number, page: number, size: number) => ({
  total,
  page,
  pageSize: size,
  totalPages: Math.max(1, Math.ceil(total / size)),
});
