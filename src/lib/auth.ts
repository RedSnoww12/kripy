import { createClient } from "@/lib/supabase/server";
import { isDevMode, DEV_USER_ID } from "@/lib/dev-mode";

/** Get the current user ID. Returns DEV_USER_ID in dev mode. */
export async function getUserId(): Promise<string | null> {
  if (isDevMode()) {
    return DEV_USER_ID;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
