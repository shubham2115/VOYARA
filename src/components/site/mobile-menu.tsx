"use client";
import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileMenu({ links, signedIn, dashHref }: { links: { href: string; label: string }[]; signedIn: boolean; dashHref: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="lg:hidden">
      <Button variant="ghost" size="icon" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
        {open ? <X /> : <Menu />}
      </Button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-navy-100 bg-ivory p-4 shadow-lift">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium hover:bg-navy-50">{l.label}</Link>
            ))}
            <Link href={signedIn ? dashHref : "/login"} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-navy px-3 py-3 text-center font-semibold text-white">
              {signedIn ? "My Account" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
