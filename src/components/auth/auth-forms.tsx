"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validators/auth";
import type { z } from "zod";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong");
  return json.data;
}

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  async function onSubmit(v: z.input<typeof loginSchema>) {
    const res = await signIn("credentials", { ...v, redirect: false });
    if (res?.error || !res?.ok) return void toast.error(res?.code === "rate_limited" ? "Too many attempts. Try again later." : "Invalid email or password");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/account");
    router.refresh();
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
      <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="current-password" {...register("password")} /></Field>
      <div className="text-right text-sm"><Link href="/forgot-password" className="text-gold-600 hover:underline">Forgot password?</Link></div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm text-navy-400">New here? <Link href="/register" className="font-semibold text-navy hover:underline">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
  async function onSubmit(v: z.input<typeof registerSchema>) {
    try {
      await post("/api/auth/register", v);
      const res = await signIn("credentials", { email: v.email, password: v.password, redirect: false });
      toast.success("Welcome to Voyara!");
      router.push(res?.ok ? "/account" : "/login");
      router.refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not register"); }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Full name" error={errors.name?.message}><Input autoComplete="name" {...register("name")} /></Field>
      <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
      <Field label="Phone (optional)" error={errors.phone?.message}><Input type="tel" autoComplete="tel" {...register("phone")} /></Field>
      <Field label="Password" error={errors.password?.message} hint="8+ characters with upper, lower case and a number"><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</Button>
      <p className="text-center text-sm text-navy-400">Already registered? <Link href="/login" className="font-semibold text-navy hover:underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });
  const [sent, setSent] = React.useState(false);
  async function onSubmit(v: z.input<typeof forgotSchema>) {
    try { await post("/api/auth/forgot-password", v); setSent(true); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  if (sent) return <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">If that email is registered, a reset link is on its way. It expires in 1 hour.</p>;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>Send reset link</Button>
    </form>
  );
}

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ password: string }>({ resolver: zodResolver(resetSchema.pick({ password: true })) });
  async function onSubmit(v: { password: string }) {
    try { await post("/api/auth/reset-password", { token, password: v.password }); toast.success("Password updated"); router.push("/login"); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  if (!token) return <p className="text-sm text-red-600">This reset link is missing its token. Request a new one.</p>;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="New password" error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>Update password</Button>
    </form>
  );
}
