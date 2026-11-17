"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { phoneSchema } from "@/lib/validators/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: phoneSchema,
  travelDate: z.string().optional(),
  adults: z.number({ message: "Required" }).int().min(1).max(30),
  children: z.number({ message: "Required" }).int().min(0).max(20),
  message: z.string().max(2000).optional(),
  couponCode: z.string().max(30).optional(),
});
type Values = z.infer<typeof schema>;

export function EnquiryForm({ packageId, destinationId, user, source = "PACKAGE_BOOKING" }: {
  packageId?: string; destinationId?: string; user?: { name: string; email: string } | null; source?: "PACKAGE_BOOKING" | "CONTACT";
}) {
  const [ref, setRef] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", phone: "", adults: 2, children: 0 },
  });

  async function onSubmit(v: Values) {
    const res = await fetch("/api/enquiries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, packageId, destinationId, source }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return void toast.error(json?.error?.message ?? "Could not submit your enquiry");
    setRef(json.data.reference);
    reset();
    toast.success("Enquiry submitted");
  }

  if (ref) {
    return (
      <div className="py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-3 font-serif text-xl">Thank you!</h3>
        <p className="mt-1 text-sm text-navy-400">Your enquiry reference is <b>{ref}</b>. Our travel expert will contact you shortly.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setRef(null)}>Send another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <Field label="Full name" error={errors.name?.message}><Input autoComplete="name" {...register("name")} /></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
        <Field label="Phone" error={errors.phone?.message}><Input type="tel" autoComplete="tel" {...register("phone")} /></Field>
      </div>
      <Field label="Travel date" error={errors.travelDate?.message}><Input type="date" min={new Date().toISOString().slice(0, 10)} {...register("travelDate")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Adults" error={errors.adults?.message}><Input type="number" min={1} {...register("adults", { valueAsNumber: true })} /></Field>
        <Field label="Children" error={errors.children?.message}><Input type="number" min={0} {...register("children", { valueAsNumber: true })} /></Field>
      </div>
      <Field label="Message (optional)"><Textarea rows={3} {...register("message")} /></Field>
      <Field label="Coupon code (optional)"><Input {...register("couponCode")} className="uppercase" /></Field>
      <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : source === "CONTACT" ? "Send enquiry" : "Book This Package"}</Button>
      <p className="text-center text-xs text-navy-300">No payment now. We will send a quotation first.</p>
    </form>
  );
}
