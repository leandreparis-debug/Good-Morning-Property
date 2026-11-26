"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** Ends the current session (this device only) and goes back to /connexion. */
export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${ROUTES.signIn}?raison=deconnecte`);
}
