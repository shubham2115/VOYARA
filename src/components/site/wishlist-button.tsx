"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WishlistButton({ packageId, initial, className }: { packageId: string; initial: boolean; className?: string }) {
  const router = useRouter();
  const [on, setOn] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/customer/wishlist", { method: on ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId }) });
      if (res.status === 401) { toast.info("Please sign in to save favourites"); router.push("/login"); return; }
      if (!res.ok) throw new Error();
      setOn(!on);
      toast.success(on ? "Removed from wishlist" : "Saved to wishlist");
    } catch { toast.error("Could not update wishlist"); } finally { setBusy(false); }
  }

  return (
    <button onClick={toggle} disabled={busy} aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110", className)}>
      <Heart className={cn("h-4 w-4", on ? "fill-red-500 text-red-500" : "text-navy")} />
    </button>
  );
}
