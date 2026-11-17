import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset password" };
export default function Page() {
  return (<><h1 className="mb-1 text-3xl">Choose a new password</h1><p className="mb-6 text-sm text-navy-400">Use something strong and unique.</p><ResetForm /></>);
}
