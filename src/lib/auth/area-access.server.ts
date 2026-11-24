import { resolveUserAreaAccess } from "@/lib/auth/area-access-resolve";
import type { UserAreaAccess } from "@/lib/auth/area-access-policy";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Resolve which private areas the current user may enter (server-only). */
export async function getUserAreaAccess(): Promise<UserAreaAccess | null> {
  const session = await getAuthSession();
  if (!session) return null;

  const supabase = await createClient();
  const access = await resolveUserAreaAccess(supabase, session.user.id);

  if (!access.hasClientPortal && session.profile.company_ids.length > 0 && !access.isStaff) {
    return { ...access, hasClientPortal: true };
  }

  return access;
}
