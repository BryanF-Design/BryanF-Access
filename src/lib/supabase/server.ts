import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client, scoped to the caller's session cookie.
 * Uses the anon key + RLS — this is the client the portal reads through,
 * so a bug here can never expose another client's rows.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render; middleware refreshes
            // the session on navigation, so this can be safely ignored.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for privileged, server-only operations (signed storage
 * URLs, audit-log writes). This key bypasses RLS — it must never be imported
 * from a Client Component or leaked to the browser bundle.
 *
 * Left untyped on purpose: the installed postgrest-js version collapses
 * `.insert()`'s argument type to `never` when the client carries the
 * `Database` generic but the call has no explicit `.returns<T>()`/
 * `.maybeSingle<T>()` override. This client's only write (audit_log) has
 * no such override available, so it stays untyped; reads elsewhere keep
 * the `Database` generic and always pair it with an explicit override.
 */
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
