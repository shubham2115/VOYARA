"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { apiRequest } from "@/lib/client-api";

export function DeleteButton({ url, label }: { url: string; label: string }) {
  const router = useRouter();
  return (
    <Confirm
      trigger={<Button size="icon" variant="ghost" aria-label={`Delete ${label}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
      title={`Delete ${label}?`} description="It will be removed from the website. This can be restored only by a database administrator." confirmLabel="Delete" destructive
      onConfirm={async () => { try { await apiRequest(url, "DELETE"); toast.success("Deleted"); router.refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete"); } }}
    />
  );
}
