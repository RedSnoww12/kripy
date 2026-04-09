"use client";

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import type { PhaseId } from "@/logic/phases";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggle } = useTheme();
  const [phase] = useState<PhaseId>("A");

  return (
    <>
      <Header phase={phase} onThemeToggle={toggle} isDark={isDark} />
      <main className="px-3.5 py-3 pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
