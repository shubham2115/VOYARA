# Voyara – Architecture

## 1. Requirements analysis (summary)
Domestic India travel platform: public catalogue (destinations, packages, blog), enquiry funnel
(enquiry → quotation → booking → payment), customer self-service dashboard, and an admin/staff portal.
Non-negotiables: server-side RBAC, Zod validation, rate limiting, audit trail, Razorpay signature verification,
graceful fallbacks when optional keys (Cloudinary, Resend/SMTP, OpenAI, Maps, Razorpay) are missing.

## 2. Layered architecture
```
Route handlers / Server components / Server actions      (src/app)
        │  parse + validate (Zod)  ── authorize (src/lib/rbac)
        ▼
Services (business logic, transactions, audit)           (src/server/services)
        ▼
Prisma client → PostgreSQL                               (src/lib/db.ts, prisma/schema.prisma)
Integrations (email, razorpay, cloudinary, openai, whatsapp, pdf)   (src/server/integrations)
```
Rules: pages never touch Prisma directly for mutations; every mutation goes through a service and writes an
`AuditLog`; authorization is enforced in `requirePermission()` (API) / `requireRole()` (pages) using the role
from the DB-backed session, never from client input. Middleware is only a coarse redirect guard.

## 3. Folder structure
```
prisma/            schema.prisma, seed.ts (+ seed-data/)
src/app/
  (public)/        /, destinations, packages, customize-trip, blog, about, contact, faq, policies, compare, map, ai-planner
  (auth)/          login, register, forgot-password, reset-password
  account/         customer dashboard (overview, enquiries, bookings, wishlist, reviews, profile)
  admin/           separate layout: dashboard, destinations, packages, categories, enquiries, bookings,
                   customers, staff, reviews, coupons, blog, cms, reports, settings
  api/             REST endpoints (auth, destinations, packages, enquiries, customer/*, admin/*, payments, upload, ai)
  sitemap.ts, robots.ts
src/components/    ui/ (shadcn-style primitives), site/ (navbar, footer, cards), admin/, forms/
src/lib/           db, auth config, rbac, env, validators (zod), api helpers, rate-limit, utils
src/server/        services/*, integrations/*
tests/             vitest unit + integration
docs/              ARCHITECTURE.md, ER.md, ROADMAP.md
```

## 4. RBAC
Roles: CUSTOMER, STAFF, ADMIN (PUBLIC = unauthenticated). Permission strings (`enquiry:read:all`,
`enquiry:read:assigned`, `booking:manage`, …) live in `src/lib/rbac.ts` as the single source of truth and are
mirrored into `Permission`/`RolePermission` tables by the seed for auditability. STAFF access to enquiries and
bookings is scoped to `assignedToId = session.user.id`. Customers only ever query rows where `userId = session.user.id`.

## 5. Security
bcrypt(12) password hashing; JWT sessions with role re-read from DB on sign-in and refreshed on token update;
in-memory sliding-window rate limiter (pluggable to Redis) on login/register/forgot/enquiry/contact/newsletter;
Zod on every input; upload endpoint checks MIME + size + magic bytes, then Cloudinary (or local fallback);
security headers in next.config; secrets only via env; Razorpay HMAC verified server-side with timing-safe compare.

## 6. Integrations & fallbacks
| Integration | Env | Fallback when missing |
|---|---|---|
| Email | RESEND_API_KEY or SMTP_* | logs to console + stores Notification |
| Cloudinary | CLOUDINARY_* | local `/public/uploads` (dev only) |
| Razorpay | RAZORPAY_KEY_ID/SECRET | payment disabled, manual payment recording |
| OpenAI | OPENAI_API_KEY | deterministic template itinerary from DB packages |
| Maps | NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | SVG state grid map |
| WhatsApp | NEXT_PUBLIC_WHATSAPP_NUMBER | wa.me deep links; provider hook stubbed |
