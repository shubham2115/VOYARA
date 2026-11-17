# Roadmap
1. Foundation: config, Prisma schema, migrations, auth, RBAC, rate limiting, UI primitives.
2. Public site: home, destinations, packages, filters, detail pages, content pages, SEO.
3. Customer: register/login/reset, enquiry + customize trip, dashboard, wishlist, reviews.
4. Admin: dashboard, CRUD (destinations/packages), enquiries, bookings, customers, staff.
5. Integrations: email, Razorpay, PDF, WhatsApp hooks.
6. Advanced: AI planner, analytics, map, comparison, tests, security pass.
Each stage ends with: `npm run typecheck && npm run lint && npm test`.
