import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };
export default function Page() {
  return (<><h1 className="mb-1 text-3xl">Forgot password</h1><p className="mb-6 text-sm text-navy-400">Enter your email and we will send a reset link.</p><ForgotForm /></>);
}
