import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in" };
export default function Page() {
  return (<><h1 className="mb-1 text-3xl">Welcome back</h1><p className="mb-6 text-sm text-navy-400">Sign in to track enquiries and bookings.</p><LoginForm /></>);
}
