import { BarChart3, BookOpen, CalendarCheck, FolderTree, Globe, LayoutDashboard, MapPinned, MessageSquare, Package, Settings, Star, Tag, UserCog, Users, Mail } from "lucide-react";

export const ADMIN_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "admin:access" },
  { href: "/admin/destinations", label: "Destinations", icon: MapPinned, perm: "destination:manage" },
  { href: "/admin/packages", label: "Tour Packages", icon: Package, perm: "package:manage" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, perm: "category:manage" },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, perm: "enquiry:read" },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck, perm: "booking:read" },
  { href: "/admin/customers", label: "Customers", icon: Users, perm: "customer:read" },
  { href: "/admin/staff", label: "Staff Management", icon: UserCog, perm: "staff:manage" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, perm: "review:manage" },
  { href: "/admin/coupons", label: "Coupons & Offers", icon: Tag, perm: "coupon:manage" },
  { href: "/admin/blog", label: "Blog Management", icon: BookOpen, perm: "blog:manage" },
  { href: "/admin/cms", label: "Website CMS", icon: Globe, perm: "cms:manage" },
  { href: "/admin/messages", label: "Messages & Subscribers", icon: Mail, perm: "cms:manage" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, perm: "report:view" },
  { href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings:manage" },
] as const;
