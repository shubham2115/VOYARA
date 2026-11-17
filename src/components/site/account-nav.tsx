"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Heart, LayoutDashboard, LogOut, MessageSquare, Plane, Star, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/enquiries", label: "My Enquiries", icon: MessageSquare },
  { href: "/account/bookings", label: "My Bookings", icon: Plane },
  { href: "/account/wishlist", label: "My Wishlist", icon: Heart },
  { href: "/account/reviews", label: "My Reviews", icon: Star },
  { href: "/account/profile", label: "Profile Settings", icon: UserCog },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((i) => {
        const active = i.href === "/account" ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-navy text-white" : "hover:bg-navy-50")}>
            <i.icon className="h-4 w-4" /> {i.label}
          </Link>
        );
      })}
      <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign out</button>
    </nav>
  );
}
