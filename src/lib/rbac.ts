import type { Role } from "@prisma/client";

/** Single source of truth for permissions. Mirrored to the Permission tables by the seed. */
export const PERMISSIONS = {
  "enquiry:read:all": "View all enquiries",
  "enquiry:read:assigned": "View assigned enquiries",
  "enquiry:update": "Update enquiry status / notes",
  "enquiry:assign": "Assign enquiries to staff",
  "quotation:manage": "Create and send quotations",
  "booking:read:all": "View all bookings",
  "booking:read:assigned": "View assigned bookings",
  "booking:manage": "Create / update bookings",
  "payment:manage": "Record payments",
  "customer:read": "View customers",
  "customer:manage": "Activate / deactivate customers",
  "staff:manage": "Manage staff accounts",
  "destination:manage": "Manage destinations",
  "package:manage": "Manage packages",
  "category:manage": "Manage categories",
  "review:manage": "Moderate reviews",
  "coupon:manage": "Manage coupons",
  "blog:manage": "Manage blog",
  "cms:manage": "Manage website content",
  "report:view": "View reports",
  "settings:manage": "Manage settings",
  "admin:access": "Open the admin portal",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as Permission[];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CUSTOMER: [],
  STAFF: [
    "admin:access",
    "enquiry:read:assigned",
    "enquiry:update",
    "quotation:manage",
    "booking:read:assigned",
    "booking:manage",
    "payment:manage",
  ],
  ADMIN: ALL,
};

export const can = (role: Role | undefined | null, perm: Permission) =>
  !!role && ROLE_PERMISSIONS[role].includes(perm);

export const canAny = (role: Role | undefined | null, perms: Permission[]) => perms.some((p) => can(role, p));
