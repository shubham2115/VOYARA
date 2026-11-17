"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Field, Input, Select } from "@/components/ui/form";
import { apiRequest } from "@/lib/client-api";

export function ToggleActive({ url, isActive, label }: { url: string; isActive: boolean; label: string }) {
  const router = useRouter();
  return (
    <Confirm
      trigger={<Button size="sm" variant={isActive ? "outline" : "primary"}>{isActive ? "Deactivate" : "Activate"}</Button>}
      title={`${isActive ? "Deactivate" : "Activate"} ${label}?`}
      description={isActive ? "They will be signed out on their next request and unable to log in." : "They will be able to sign in again."}
      confirmLabel={isActive ? "Deactivate" : "Activate"} destructive={isActive}
      onConfirm={async () => { try { await apiRequest(url, "PUT", { isActive: !isActive }); toast.success("Updated"); router.refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }}
    />
  );
}

export function StaffForm() {
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", email: "", phone: "", password: "", role: "STAFF" });
  const [busy, setBusy] = React.useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form className="card grid gap-3 p-5 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await apiRequest("/api/admin/staff", "POST", f); toast.success("Account created"); setF({ name: "", email: "", phone: "", password: "", role: "STAFF" }); router.refresh(); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); } finally { setBusy(false); } }}>
      <h2 className="font-serif text-xl md:col-span-2">Create staff account</h2>
      <Field label="Name"><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Phone"><Input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <Field label="Role"><Select value={f.role} onChange={(e) => set("role", e.target.value)}><option value="STAFF">Staff</option><option value="ADMIN">Administrator</option></Select></Field>
      <Field label="Temporary password" hint="8+ chars, upper, lower and number" className="md:col-span-2"><Input type="password" required value={f.password} onChange={(e) => set("password", e.target.value)} /></Field>
      <div className="md:col-span-2"><Button type="submit" disabled={busy}>Create account</Button></div>
    </form>
  );
}
