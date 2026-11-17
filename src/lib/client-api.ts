/** Browser helper: JSON request that throws a readable Error on failure. */
export async function apiRequest<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const fields = json?.error?.details && typeof json.error.details === "object" ? Object.values(json.error.details as Record<string, string[]>).flat()[0] : null;
    throw new Error(fields || json?.error?.message || `Request failed (${res.status})`);
  }
  return json?.data as T;
}
