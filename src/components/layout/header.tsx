"use client";

import { PHASE_NAMES, PHASE_COLORS, type PhaseId } from "@/logic/phases";

interface HeaderProps {
  phase: PhaseId;
  onThemeToggle: () => void;
  isDark: boolean;
}

export function Header({ phase, onThemeToggle, isDark }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/92 backdrop-blur-2xl border-b border-border px-4 py-3 flex items-center justify-between supports-[padding:env(safe-area-inset-top)]:pt-[max(12px,env(safe-area-inset-top))]">
      <span className="text-lg font-bold tracking-widest bg-gradient-to-br from-foreground via-primary to-purple-400 bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">
        MYSF
      </span>

      <div className="flex items-center gap-2">
        {/* Phase pill */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer active:scale-95 transition-transform"
          style={{
            borderColor: PHASE_COLORS[phase],
            color: PHASE_COLORS[phase],
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: PHASE_COLORS[phase] }}
          />
          {PHASE_NAMES[phase]}
        </span>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary border border-border transition-all active:scale-90 text-sm"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
