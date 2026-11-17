import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;

/** Detect the real image type from magic bytes (never trust the client-supplied MIME type). */
export function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export const cloudinaryConfigured = () => !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export async function storeImage(file: File, folder = "voyara"): Promise<{ url: string; provider: "cloudinary" | "local" }> {
  if (file.size > MAX_BYTES) throw new Error("Image must be 5 MB or smaller");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) throw new Error("Only JPEG, PNG or WebP images are allowed");

  if (cloudinaryConfigured()) {
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buf)], { type: type.mime }), `upload.${type.ext}`);
    form.append("api_key", process.env.CLOUDINARY_API_KEY!);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Image upload failed");
    const json = (await res.json()) as { secure_url: string };
    return { url: json.secure_url, provider: "cloudinary" };
  }

  // Development fallback only: write to public/uploads with a random name (never the client's filename)
  if (process.env.NODE_ENV === "production") throw new Error("Image storage is not configured (set CLOUDINARY_* variables)");
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomBytes(12).toString("hex")}.${type.ext}`;
  await fs.writeFile(path.join(dir, name), buf);
  return { url: `/uploads/${name}`, provider: "local" };
}
