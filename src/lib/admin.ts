import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE, getConfiguredAdminEmail } from "@/lib/admin-session";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Admin } from "@/types/database";

/**
 * Reads the current admin record via the RLS-scoped client — the
 * `admins_select_own` policy means this only ever returns a row for the
 * signed-in user's own record, so a client session can never read it.
 */
export async function getCurrentAdmin(): Promise<Admin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return getAdminFromSignedCookie();

  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<Admin>();

  return data;
}

async function getAdminFromSignedCookie(): Promise<Admin | null> {
  const cookieStore = await cookies();
  const email = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!email || email !== getConfiguredAdminEmail()) return null;

  const service = createServiceRoleClient();
  const { data } = await service
    .from("admins")
    .select("*")
    .eq("email", email)
    .maybeSingle<Admin>();

  return data ?? null;
}

/**
 * Gate for every admin page and every privileged Server Action. Never trust
 * a check performed only in a layout — actions can be invoked directly, so
 * call this at the top of each one too before touching the service-role client.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
