import "dotenv/config";
import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { can, canAny, ROLE_PERMISSIONS } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { verifyRazorpaySignature } from "@/server/integrations/razorpay";
import { sniffImage } from "@/server/integrations/storage";
import { statusFromPayment } from "@/server/services/bookings";
import { registerSchema, passwordSchema } from "@/lib/validators/auth";
import { enquirySchema } from "@/lib/validators/enquiry";
import { packageSchema, couponSchema } from "@/lib/validators/catalog";
import { cmsSchemas } from "@/server/services/admin-content";
import { slugify } from "@/lib/utils";

describe("RBAC", () => {
  it("customers have no admin permissions", () => {
    expect(ROLE_PERMISSIONS.CUSTOMER).toHaveLength(0);
    expect(can("CUSTOMER", "admin:access")).toBe(false);
  });
  it("staff are limited to assigned work and cannot manage staff, settings or catalog", () => {
    expect(can("STAFF", "enquiry:read:assigned")).toBe(true);
    expect(can("STAFF", "enquiry:read:all")).toBe(false);
    for (const p of ["staff:manage", "settings:manage", "package:manage", "destination:manage", "enquiry:assign", "customer:manage"] as const) expect(can("STAFF", p)).toBe(false);
  });
  it("admin has everything and unauthenticated nothing", () => {
    expect(can("ADMIN", "staff:manage")).toBe(true);
    expect(can(undefined, "admin:access")).toBe(false);
    expect(canAny("STAFF", ["enquiry:read:all", "enquiry:read:assigned"])).toBe(true);
  });
});

describe("rate limiter", () => {
  it("blocks after the limit within the window", () => {
    const key = `t:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const r = rateLimit(key, 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });
});

describe("Razorpay signature verification", () => {
  const secret = "test_secret";
  const sign = (o: string, p: string) => crypto.createHmac("sha256", secret).update(`${o}|${p}`).digest("hex");
  it("accepts a valid signature", () => expect(verifyRazorpaySignature("order_1", "pay_1", sign("order_1", "pay_1"), secret)).toBe(true));
  it("rejects tampered payment id, wrong secret, malformed or empty signatures", () => {
    expect(verifyRazorpaySignature("order_1", "pay_2", sign("order_1", "pay_1"), secret)).toBe(false);
    expect(verifyRazorpaySignature("order_1", "pay_1", sign("order_1", "pay_1"), "other")).toBe(false);
    expect(verifyRazorpaySignature("order_1", "pay_1", "nothex", secret)).toBe(false);
    expect(verifyRazorpaySignature("order_1", "pay_1", "", secret)).toBe(false);
  });
  it("never verifies when no secret is configured", () => expect(verifyRazorpaySignature("o", "p", sign("o", "p"), "")).toBe(false));
});

describe("payment → booking status", () => {
  it("derives status from amounts", () => {
    expect(statusFromPayment("CONFIRMED", 1000, 0)).toBe("CONFIRMED");
    expect(statusFromPayment("CONFIRMED", 1000, 400)).toBe("PARTIALLY_PAID");
    expect(statusFromPayment("PARTIALLY_PAID", 1000, 1000)).toBe("FULLY_PAID");
  });
  it("never overrides cancelled or completed bookings", () => {
    expect(statusFromPayment("CANCELLED", 1000, 1000)).toBe("CANCELLED");
    expect(statusFromPayment("COMPLETED", 1000, 500)).toBe("COMPLETED");
  });
});

describe("upload sniffing", () => {
  it("recognises real image headers and rejects others", () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))?.ext).toBe("jpg");
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))?.ext).toBe("png");
    expect(sniffImage(Buffer.from("<svg onload=alert(1)></svg>"))).toBeNull();
    expect(sniffImage(Buffer.from("GIF89a000000000000"))).toBeNull();
  });
});

describe("validators", () => {
  it("enforces password strength and ignores a client-supplied role", () => {
    expect(passwordSchema.safeParse("weak").success).toBe(false);
    expect(passwordSchema.safeParse("Str0ngPassw0rd").success).toBe(true);
    const parsed = registerSchema.parse({ name: "Asha", email: "ASHA@Example.com", password: "Str0ngPassw0rd", role: "ADMIN" });
    expect(parsed.email).toBe("asha@example.com");
    expect("role" in parsed).toBe(false);
  });
  it("validates enquiries", () => {
    expect(enquirySchema.safeParse({ name: "A", email: "x", phone: "1" }).success).toBe(false);
    const ok = enquirySchema.parse({ name: "Asha Rao", email: "a@b.co", phone: "+919876543210", travelDate: "" });
    expect(ok.adults).toBe(1);
    expect(ok.travelDate).toBeUndefined();
  });
  it("rejects a discount that is not below the price and percent coupons over 100", () => {
    const base = { name: "Trip", summary: "A nice trip", destinationId: "d1", coverImage: "https://x.test/a.jpg", durationDays: 3, durationNights: 2, price: 1000, tier: "BUDGET", hotelCategory: "STANDARD" };
    expect(packageSchema.safeParse({ ...base, discountedPrice: 1500 }).success).toBe(false);
    expect(packageSchema.safeParse({ ...base, discountedPrice: 900 }).success).toBe(true);
    expect(couponSchema.safeParse({ code: "ABC", discountType: "PERCENT", value: 150 }).success).toBe(false);
  });
  it("rejects javascript: image URLs", () => {
    const base = { name: "Trip", summary: "A nice trip", destinationId: "d1", durationDays: 3, durationNights: 2, price: 1000, tier: "BUDGET", hotelCategory: "STANDARD" };
    expect(packageSchema.safeParse({ ...base, coverImage: "javascript:alert(1)" }).success).toBe(false);
  });
  it("only accepts whitelisted CMS shapes", () => {
    expect(cmsSchemas["site.contact"].safeParse({ phone: "1", email: "bad", address: "", whatsapp: "" }).success).toBe(false);
    expect(slugify("Rann of Kutch")).toBe("rann-of-kutch");
  });
});
