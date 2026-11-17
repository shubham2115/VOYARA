"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";

export function NewsletterForm() {
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: new FormData(form).get("email") }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not subscribe");
      toast.success("You're on the list. Welcome aboard!");
      form.reset();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not subscribe"); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md gap-2">
      <Input type="email" name="email" required placeholder="you@example.com" aria-label="Email address" className="border-white/20 bg-white/10 text-white placeholder:text-white/50" />
      <Button type="submit" variant="gold" disabled={busy}>{busy ? "…" : "Subscribe"}</Button>
    </form>
  );
}
