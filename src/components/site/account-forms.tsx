"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({ defaultValues: { name, phone } });
  async function onSubmit(v: { name: string; phone: string }) {
    const res = await fetch("/api/customer/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const json = await res.json().catch(() => null);
    if (!res.ok) return void toast.error(json?.error?.details?.phone?.[0] ?? json?.error?.message ?? "Could not save");
    toast.success("Profile updated"); router.refresh();
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card max-w-lg space-y-4 p-6">
      <Field label="Email" hint="Email cannot be changed"><Input value={email} disabled readOnly /></Field>
      <Field label="Full name" error={errors.name?.message}><Input {...register("name", { required: "Required", minLength: { value: 2, message: "Too short" } })} /></Field>
      <Field label="Phone"><Input type="tel" {...register("phone")} /></Field>
      <Button type="submit" disabled={isSubmitting}>Save changes</Button>
    </form>
  );
}

export function ReviewForm({ bookingId, label }: { bookingId: string; label: string }) {
  const router = useRouter();
  const [rating, setRating] = React.useState(5);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<{ title: string; body: string }>();
  async function onSubmit(v: { title: string; body: string }) {
    const res = await fetch("/api/customer/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, rating, ...v }) });
    const json = await res.json().catch(() => null);
    if (!res.ok) return void toast.error(json?.error?.message ?? "Could not submit review");
    toast.success("Thanks! Your review will appear once approved."); reset(); router.refresh();
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-3 p-5">
      <h3 className="font-serif text-lg">{label}</h3>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}><Star className={cn("h-7 w-7", n <= rating ? "fill-gold text-gold" : "text-navy-200")} /></button>))}</div>
      <Field label="Title (optional)"><Input {...register("title")} /></Field>
      <Field label="Your review" error={errors.body?.message}><Textarea rows={4} {...register("body", { required: "Required", minLength: { value: 10, message: "At least 10 characters" } })} /></Field>
      <Button type="submit" disabled={isSubmitting}>Submit review</Button>
    </form>
  );
}
