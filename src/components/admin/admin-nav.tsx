"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { ADMIN_ITEMS } from "./nav-items";



export function AdminNav({ allowed }: { allowed: string[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {ADMIN_ITEMS.filter((i) => allowed.includes(i.href)).map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-gold text-navy-900" : "text-navy-100 hover:bg-white/10")}>
            <i.icon className="h-4 w-4" /> {i.label}
          </Link>
        );
      })}
      <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-white/10"><LogOut className="h-4 w-4" /> Sign out</button>
    </nav>
  );
}
