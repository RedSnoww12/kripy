"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function checkDevMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !url || url.includes("placeholder") || url.includes("your-project");
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGoogleLogin() {
    if (checkDevMode()) {
      window.location.href = "/dashboard";
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  async function handleAnonymous() {
    if (checkDevMode()) {
      window.location.href = "/dashboard";
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/onboarding");
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm text-center relative">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <h1 className="text-5xl font-bold tracking-wider bg-gradient-to-br from-primary to-purple-400 bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)] mb-1">
        MYSF
      </h1>
      <p className="text-xs text-muted-foreground uppercase tracking-[3px] font-medium mb-12">
        My Systeme Fluide
      </p>

      {checkDevMode() && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 text-[var(--orange)] text-[11px]">
          Mode dev — pas de Supabase configure
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {checkDevMode() ? "Entrer (mode dev)" : "Continuer avec Google"}
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          ou
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={handleAnonymous}
        disabled={loading}
        className="text-sm text-muted-foreground px-7 py-3 rounded-2xl border border-border font-medium transition-colors hover:border-primary hover:text-foreground active:scale-[0.97] disabled:opacity-50"
      >
        Continuer sans compte
      </button>

      {error && (
        <p className="mt-4 text-xs text-destructive max-w-[300px] mx-auto">
          {error}
        </p>
      )}
    </div>
  );
}
