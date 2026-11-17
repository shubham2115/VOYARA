# Voyara — India Travel & Tour Booking Platform

Full-stack Next.js 15 (App Router) platform: public website, customer dashboard and a secure admin/staff portal
with enquiry → quotation → booking → payment workflow.

Docs: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/ER.md`](docs/ER.md) · [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Stack
Next.js 15 · TypeScript · Tailwind CSS · Radix UI primitives (shadcn-style, in `src/components/ui`) · Framer Motion ·
Lucide · PostgreSQL + Prisma 6 · Auth.js v5 (credentials, JWT) · React Hook Form + Zod · Razorpay · Resend/SMTP ·
Cloudinary · OpenAI (optional) · Recharts · PDFKit · Vitest

## Quick start
```bash
npm install
cp .env.example .env              # then edit values (set AUTH_SECRET: `npx auth secret`)
npm run db:up                     # PostgreSQL 16 in Docker on localhost:5433 (or point DATABASE_URL at your own DB)
npx prisma migrate dev            # apply migrations (prisma/migrations)
npm run db:seed                   # catalogue + admin from SEED_ADMIN_* + demo data
npm run dev                       # http://localhost:3000
```
Sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` → `/admin`.
No admin is created if those variables are empty — credentials are never hardcoded.

> npm 11 may block package install scripts. If `prisma generate` was not run automatically, run `npx prisma generate`.

## Environment variables
| Variable | Required | Purpose / fallback when empty |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Signs sessions (`npx auth secret`) |
| `AUTH_TRUST_HOST` | prod | `true` behind a proxy |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URL (sitemap, emails, reset links) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed | Development admin. Also the password of demo users |
| `SEED_SAMPLE_DATA` | no | `false` skips demo customers/enquiries/bookings |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Email via Resend |
| `SMTP_HOST/PORT/USER/PASS` | no | Email via SMTP. If neither is set, emails are **logged to the server console** |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | prod | Image uploads. Empty → local `public/uploads` (dev only; disabled in production) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | no | Online payments (use **test** keys). Empty → customers see "contact us"; admins record offline payments |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | no | Reserved for client use (checkout key is returned by the order API) |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | no | AI planner. Empty → itinerary built from your own packages |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no | Adds a Google Maps embed to the India map. Empty → built-in state map |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | no | Default WhatsApp number (the CMS value takes precedence) |

Secrets are only read on the server; only `NEXT_PUBLIC_*` values reach the browser.

## Database
- Schema: `prisma/schema.prisma` (see ER diagram). Migrations in `prisma/migrations`.
- Create a migration after schema edits: `npx prisma migrate dev --name <change>`
- Production: `npm run db:deploy` (`prisma migrate deploy`). Inspect data: `npm run db:studio`.
- **Seed data**: 10 categories, 30 destinations, 14 packages, blog posts, coupons, CMS content (`prisma/seed-data`).
  Demo users/enquiries/bookings use the `@sample.voyara.dev` domain and can be removed with `npm run db:clear-sample`.
- Seed images are deterministic **placeholders** (picsum.photos). Replace them with real photography through the
  admin panel (Destinations / Packages → upload).

## Commands
| | |
|---|---|
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next config) |
| `npm test` | Vitest: unit tests + DB integration test of the enquiry→booking→payment funnel |

## Roles & security model
- Roles: `CUSTOMER`, `STAFF`, `ADMIN` (+ anonymous public). Permissions are defined once in `src/lib/rbac.ts`.
- Authorization is **server-side**: `requireApiUser(permission)` for APIs, `requirePageUser()` for pages. The user and
  role are re-read from the database on every request (deactivated users lose access immediately); the role never
  comes from the client. Middleware is only a coarse redirect.
- Staff see only enquiries/bookings assigned to them (scoped in the query itself, so guessed ids return 404).
  Customers only ever query rows with their own `userId`.
- bcrypt(12) hashes, Zod on every input, Prisma (parameterised SQL), rate limits (login, register, forgot/reset
  password, enquiries, contact, newsletter, AI, coupons, uploads), security headers, audit log for admin actions,
  magic-byte validated image uploads, CSV export formula-injection guard, password-reset tokens stored hashed.
- Razorpay: orders are created for the booking owner only, amounts are validated against the balance due, and a payment
  is marked paid **only after** the HMAC signature is verified server-side (`src/server/integrations/razorpay.ts`).
- The in-memory rate limiter is per instance; swap `src/lib/rate-limit.ts` for Redis when running multiple instances.

## API overview
Responses: `{ success, data, meta? }` or `{ success: false, error: { message, details? } }`.
Public: `GET /api/destinations[/slug]`, `GET /api/packages[/slug]`, `GET /api/packages/[slug]/itinerary` (PDF),
`POST /api/enquiries`, `/api/contact`, `/api/newsletter`, `/api/coupons/validate`, `/api/ai/plan`.
Auth: `POST /api/auth/register|forgot-password|reset-password`; sign-in is Auth.js credentials
(`/api/auth/callback/credentials`, used by `/login`) with its own rate limit.
Customer: `/api/customer/{enquiries,bookings,wishlist,profile,reviews}`, `/api/customer/bookings/[id]/invoice`,
`/api/payments/razorpay/{order,verify}`.
Admin: `/api/admin/{destinations,packages,categories,enquiries,bookings,customers,staff,reviews,coupons,blog,cms,messages,upload,reports/export}`
(plus `/[id]`, `/enquiries/[id]/{notes,assign,quotations,convert}`, `/bookings/[id]/payments`).

## Features checklist
Public site (home, destinations, packages, filters/sort/pagination, details, customize-trip wizard, blog, about, contact,
FAQ, policies, compare ≤3, India map, AI planner, wishlist, floating WhatsApp, SEO metadata + JSON-LD, sitemap/robots) ·
Customer dashboard (overview, enquiries with timeline, bookings + pay + invoice/itinerary PDF, wishlist, reviews for
completed trips, profile) · Admin (analytics + charts, destinations/packages CRUD with galleries and itinerary,
categories, enquiries with status/assign/notes/communication log/quotations/WhatsApp/convert/close, bookings incl.
manual create + offline payments + invoice PDF, customers, staff + performance, reviews moderation, coupons, blog, CMS,
messages & subscribers, reports + CSV export, settings/integration status + audit log).

## Integrations needing your keys
- **WhatsApp**: floating button and per-customer `wa.me` links work out of the box. Automated WhatsApp notifications
  (WhatsApp Business API) are *not* implemented; add a provider in `src/server/integrations` and call it where
  `sendMail` is called in `services/enquiries.ts`, `admin-enquiries.ts` and `bookings.ts`.
- **Google Maps**: optional embed on `/map`.

## Deployment
1. Provision PostgreSQL; set all required env vars (`NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, Cloudinary, email, Razorpay live keys).
2. `npm ci && npm run db:deploy && npm run build && npm start` (Node 20+). On Vercel add a build step `prisma migrate deploy`.
3. Create the first admin with the seed (`SEED_ADMIN_*`, `SEED_SAMPLE_DATA=false`) then rotate/remove those variables.
4. Replace the template legal pages (`/privacy-policy`, `/terms`, `/cancellation-refund-policy`) after legal review.

## Known limitations
- Demo content uses placeholder images; legal pages are templates.
- No automated WhatsApp Business messaging, refunds API, or webhook-based Razorpay reconciliation (payments are confirmed via the verified checkout callback).
- Rate limiting is in-memory (see above). Bundled tests cover rules, validators, signature verification and the booking funnel; there are no browser E2E tests.
