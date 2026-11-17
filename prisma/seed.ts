import { PrismaClient, type EnquiryStatus, type BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../src/lib/rbac";
import { slugify } from "../src/lib/utils";
import { destinations } from "./seed-data/destinations";
import { packages } from "./seed-data/packages";
import { blogs, categories, coupons, settings, testimonials } from "./seed-data/content";

config();
const db = new PrismaClient();

/** Placeholder photography (deterministic). Replace through the admin panel with real destination photos. */
const img = (seed: string, w = 1600, h = 1000) => `https://picsum.photos/seed/${slugify(seed)}/${w}/${h}`;

const SAMPLE_DOMAIN = "sample.voyara.dev"; // everything created with this domain is demo data

async function main() {
  console.log("Seeding permissions…");
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }
  const perms = await db.permission.findMany();
  await db.rolePermission.deleteMany();
  for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
    for (const k of keys) {
      const p = perms.find((x) => x.key === k)!;
      await db.rolePermission.create({ data: { role: role as "ADMIN", permissionId: p.id } });
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  let adminId: string | null = null;
  if (email && password) {
    const admin = await db.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: "ADMIN" },
      create: { name: "Administrator", email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
    });
    adminId = admin.id;
    console.log(`Admin account ready: ${admin.email}`);
  } else {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin created.");
  }

  console.log("Seeding categories…");
  const catIds: Record<string, string> = {};
  for (const [i, [name, description]] of categories.entries()) {
    const c = await db.destinationCategory.upsert({ where: { slug: slugify(name) }, update: { description }, create: { name, slug: slugify(name), description, sortOrder: i } });
    catIds[name] = c.id;
  }

  console.log("Seeding destinations…");
  const destIds: Record<string, string> = {};
  for (const d of destinations) {
    const slug = slugify(d.name);
    const data = {
      name: d.name, state: d.state, city: d.city, tagline: d.tagline, description: d.description, coverImage: img(slug),
      attractions: d.attractions, bestTimeToVisit: d.best, howToReach: d.reach, budgetMin: d.budget[0], budgetMax: d.budget[1],
      recommendedDays: d.days, latitude: d.lat, longitude: d.lng, popularity: d.popularity, isFeatured: !!d.featured, categoryId: catIds[d.category],
    };
    const row = await db.destination.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    destIds[d.name] = row.id;
    await db.destinationImage.deleteMany({ where: { destinationId: row.id } });
    await db.destinationImage.createMany({ data: [1, 2, 3, 4].map((n) => ({ destinationId: row.id, url: img(`${slug}-${n}`, 1200, 800), alt: `${d.name} view ${n}`, sortOrder: n })) });
  }
  for (const d of destinations) {
    await db.destination.update({ where: { id: destIds[d.name] }, data: { nearby: { set: d.nearby.filter((n) => destIds[n]).map((n) => ({ id: destIds[n] })) } } });
  }

  console.log("Seeding packages…");
  const pkgIds: Record<string, string> = {};
  for (const p of packages) {
    const slug = slugify(p.name);
    const data = {
      name: p.name, summary: p.summary, destinationId: destIds[p.destination], coverImage: img(`pkg-${slug}`),
      durationDays: p.days, durationNights: p.days - 1, price: p.price, discountedPrice: p.discounted ?? null,
      tier: p.tier, hotelCategory: p.hotel, travelTypes: p.types, themes: p.themes, departureCities: p.cities,
      hotelInfo: p.stay, transportInfo: p.transport, activities: p.activities, isFeatured: !!p.featured, popularity: p.popularity,
      importantInfo: "Carry a valid government photo ID. Itinerary order may change due to weather or local conditions. Entry tickets are payable locally unless stated.",
      cancellationPolicy: "Free cancellation up to 15 days before departure. 50% refund 8–14 days before. No refund within 7 days of departure.",
      maxGroupSize: 20,
    };
    const row = await db.tourPackage.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    pkgIds[p.name] = row.id;
    await db.$transaction([
      db.packageImage.deleteMany({ where: { packageId: row.id } }),
      db.packageItinerary.deleteMany({ where: { packageId: row.id } }),
      db.packageInclusion.deleteMany({ where: { packageId: row.id } }),
      db.packageExclusion.deleteMany({ where: { packageId: row.id } }),
    ]);
    await db.packageImage.createMany({ data: [1, 2, 3].map((n) => ({ packageId: row.id, url: img(`pkg-${slug}-${n}`, 1200, 800), alt: `${p.name} ${n}`, sortOrder: n })) });
    await db.packageItinerary.createMany({
      data: p.itinerary.map(([title, description], i) => ({ packageId: row.id, dayNumber: i + 1, title, description, meals: i === 0 ? ["DINNER"] : ["BREAKFAST", "DINNER"], stay: i === p.itinerary.length - 1 ? null : p.stay.split(" in ")[0] })),
    });
    await db.packageInclusion.createMany({ data: [`${p.days - 1} nights accommodation (${p.stay})`, "Daily breakfast and dinner", p.transport, "All sightseeing as per itinerary", "Driver allowance, tolls and parking", "24×7 on-trip support"].map((text, i) => ({ packageId: row.id, text, sortOrder: i })) });
    await db.packageExclusion.createMany({ data: ["Airfare / train fare to the starting point", "Lunch and personal expenses", "Monument entry fees and optional activities", "Travel insurance", "GST as applicable"].map((text, i) => ({ packageId: row.id, text, sortOrder: i })) });
  }

  console.log("Seeding coupons, blog, settings…");
  for (const c of coupons) await db.coupon.upsert({ where: { code: c.code }, update: {}, create: { ...c, validUntil: new Date(Date.now() + 180 * 86400_000) } });
  for (const [k, v] of Object.entries(settings)) await db.siteSetting.upsert({ where: { key: k }, update: {}, create: { key: k, value: v as never } });
  for (const b of blogs) {
    const cat = await db.blogCategory.upsert({ where: { slug: slugify(b.category) }, update: {}, create: { name: b.category, slug: slugify(b.category) } });
    const slug = slugify(b.title);
    await db.blog.upsert({ where: { slug }, update: {}, create: { title: b.title, slug, excerpt: b.excerpt, content: b.content, coverImage: img(`blog-${slug}`, 1400, 800), categoryId: cat.id, destinationId: destIds[b.destination], authorId: adminId, isPublished: true, publishedAt: new Date(Date.now() - Math.random() * 60 * 86400_000), seoTitle: b.title, seoDescription: b.excerpt } });
  }

  if (process.env.SEED_SAMPLE_DATA !== "false" && password) {
    console.log(`Seeding SAMPLE demo data (${SAMPLE_DOMAIN}) — remove with: npm run db:clear-sample`);
    await seedSample(password, pkgIds);
  }
  console.log("Done.");
}

async function seedSample(password: string, pkgIds: Record<string, string>) {
  const hash = await bcrypt.hash(password, 12);
  const mk = (n: string, role: "CUSTOMER" | "STAFF") => db.user.upsert({ where: { email: `${n}@${SAMPLE_DOMAIN}` }, update: {}, create: { name: n[0].toUpperCase() + n.slice(1) + " Sample", email: `${n}@${SAMPLE_DOMAIN}`, phone: "+919876543210", passwordHash: hash, role } });
  const customers = await Promise.all(["asha", "rahul", "meera", "kabir", "zoya"].map((n) => mk(n, "CUSTOMER")));
  const staff = await Promise.all(["staff1", "staff2"].map((n) => mk(n, "STAFF")));
  if ((await db.enquiry.count({ where: { email: { endsWith: SAMPLE_DOMAIN } } })) > 0) return;

  const pkgs = await db.tourPackage.findMany({ select: { id: true, destinationId: true, price: true } });
  const statuses: EnquiryStatus[] = ["NEW", "NEW", "UNDER_REVIEW", "CONTACTED", "QUOTATION_SENT", "CUSTOMER_APPROVED", "BOOKING_CONFIRMED", "BOOKING_CONFIRMED", "BOOKING_CONFIRMED", "CANCELLED", "CLOSED", "BOOKING_CONFIRMED"];
  let seq = 0;
  for (let i = 0; i < 36; i++) {
    const c = customers[i % customers.length];
    const pkg = pkgs[i % pkgs.length];
    const status = statuses[i % statuses.length];
    const created = new Date(Date.now() - (i * 5 + 1) * 86400_000);
    const adults = 1 + (i % 4);
    seq++;
    const enquiry = await db.enquiry.create({
      data: { reference: `ENQ-${created.getFullYear()}-${String(900000 + seq)}`, status, userId: c.id, name: c.name, email: c.email, phone: "+919876543210", packageId: pkg.id, destinationId: pkg.destinationId, travelDate: new Date(created.getTime() + 45 * 86400_000), adults, children: i % 3, rooms: 1 + (i % 2), budgetPerPerson: pkg.price, message: "Demo enquiry (sample data)", assignedToId: status === "NEW" ? null : staff[i % 2].id, createdAt: created },
    });
    await db.enquiryActivity.create({ data: { enquiryId: enquiry.id, type: "CREATED", toStatus: "NEW", createdAt: created } });
    if (status !== "NEW") await db.enquiryActivity.create({ data: { enquiryId: enquiry.id, type: "STATUS_CHANGED", fromStatus: "NEW", toStatus: status, actorId: staff[i % 2].id, createdAt: new Date(created.getTime() + 3600_000) } });
    if (status === "BOOKING_CONFIRMED") {
      const total = pkg.price * adults;
      const bStatus: BookingStatus = (["FULLY_PAID", "PARTIALLY_PAID", "COMPLETED", "CONFIRMED"] as const)[i % 4];
      const paid = bStatus === "FULLY_PAID" || bStatus === "COMPLETED" ? total : bStatus === "PARTIALLY_PAID" ? Math.round(total / 2) : 0;
      const booking = await db.booking.create({
        data: { reference: `BKG-${created.getFullYear()}-${String(900000 + seq)}`, status: bStatus, userId: c.id, enquiryId: enquiry.id, packageId: pkg.id, assignedToId: staff[i % 2].id, travelDate: enquiry.travelDate!, adults, children: 0, rooms: 1, totalAmount: total, amountPaid: paid, confirmedAt: created, createdAt: new Date(created.getTime() + 86400_000) },
      });
      if (paid) await db.payment.create({ data: { bookingId: booking.id, amount: paid, method: "UPI", status: "PAID", paidAt: created, reference: "SAMPLE" } });
      if (bStatus === "COMPLETED") {
        const t = testimonials[i % testimonials.length];
        await db.review.create({ data: { userId: c.id, bookingId: booking.id, packageId: pkg.id, rating: t.rating, title: t.title, body: t.body, status: "APPROVED" } });
      }
    }
  }
  // refresh denormalised rating aggregates
  const agg = await db.review.groupBy({ by: ["packageId"], where: { status: "APPROVED", packageId: { not: null } }, _avg: { rating: true }, _count: true });
  for (const a of agg) await db.tourPackage.update({ where: { id: a.packageId! }, data: { ratingAvg: a._avg.rating ?? 0, ratingCount: a._count } });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
