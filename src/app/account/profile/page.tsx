import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { ProfileForm } from "@/components/site/account-forms";

export const metadata = { title: "Profile Settings" };
export const dynamic = "force-dynamic";

export default async function Profile() {
  const u = await requirePageUser();
  const row = await db.user.findUniqueOrThrow({ where: { id: u.id }, select: { name: true, phone: true, email: true } });
  return <div><h1 className="mb-6 text-3xl">Profile Settings</h1><ProfileForm name={row.name} phone={row.phone ?? ""} email={row.email} /></div>;
}
