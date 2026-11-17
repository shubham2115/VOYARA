"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";

type V = { name: string; email: string; phone?: string; subject: string; message: string };

export function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<V>();
  async function onSubmit(v: V) {
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const json = await res.json().catch(() => null);
    if (!res.ok) return void toast.error(json?.error?.message ?? "Could not send message");
    toast.success("Message sent. We will reply soon.");
    reset();
  }
  const req = { required: "Required" };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}><Input {...register("name", req)} /></Field>
        <Field label="Email" error={errors.email?.message}><Input type="email" {...register("email", req)} /></Field>
      </div>
      <Field label="Phone (optional)"><Input type="tel" {...register("phone")} /></Field>
      <Field label="Subject" error={errors.subject?.message}><Input {...register("subject", { ...req, minLength: { value: 3, message: "Too short" } })} /></Field>
      <Field label="Message" error={errors.message?.message}><Textarea rows={5} {...register("message", { ...req, minLength: { value: 10, message: "Tell us a little more (10+ characters)" } })} /></Field>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
