/** Check if we're running with placeholder Supabase keys (local dev without real Supabase) */
export function isDevMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (
    url.includes("placeholder") ||
    url === "" ||
    url === "https://your-project.supabase.co"
  );
}

export const DEV_USER_ID = "dev-local-user-00000000";
