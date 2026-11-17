import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create account" };
export default function Page() {
  return (<><h1 className="mb-1 text-3xl">Create your account</h1><p className="mb-6 text-sm text-navy-400">Save favourites, track enquiries and review your trips.</p><RegisterForm /></>);
}
