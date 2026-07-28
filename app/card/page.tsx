import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CardView from "./CardView";

export const metadata = { title: "My card" };

export default async function CardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <CardView userId={user.id} />;
}
