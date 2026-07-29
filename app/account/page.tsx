import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountView from "./AccountView";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <AccountView email={user.email ?? ""} role={profile?.role ?? "customer"} />
  );
}
