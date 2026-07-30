import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MenuView from "./MenuView";
import type { Role } from "@/lib/types";

export const metadata = { title: "Menu" };

export default async function MenuPage() {
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

  return <MenuView role={(profile?.role ?? "customer") as Role} />;
}
