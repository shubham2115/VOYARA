"use client";
import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/form";

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed");
  return json.data.url as string;
}

/** Single (cover) or multiple (gallery) image field. Accepts uploads or pasted https URLs. */
export function ImageUploader({ value, onChange, multiple, label }: { value: string[]; onChange: (v: string[]) => void; multiple?: boolean; label: string }) {
  const [busy, setBusy] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const add = (urls: string[]) => onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try { add(await Promise.all([...files].map(upload))); } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-3">
        {value.map((u, i) => (
          <div key={u + i} className="relative h-24 w-32 overflow-hidden rounded-xl border border-navy-100">
            <Image src={u} alt="" fill sizes="128px" className="object-cover" unoptimized={u.startsWith("/uploads")} />
            <button type="button" aria-label="Remove image" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-white/90 p-1"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {(multiple || value.length === 0) && (
          <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-200 text-xs text-navy-400 hover:border-navy">
            <ImagePlus className="h-5 w-5" /> {busy ? "Uploading…" : "Upload"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <div className="flex gap-2"><Input placeholder="…or paste an https image URL" value={url} onChange={(e) => setUrl(e.target.value)} className="h-9" />
        <button type="button" className="rounded-xl border border-navy-200 px-3 text-sm hover:bg-navy-50" onClick={() => { if (/^https:\/\//.test(url)) { add([url]); setUrl(""); } else toast.error("Enter a valid https URL"); }}>Add</button></div>
    </div>
  );
}
