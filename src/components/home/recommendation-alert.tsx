"use client";

import type { Recommendation } from "@/logic/recommendation";
import { Button } from "@/components/ui/button";

interface RecommendationAlertProps {
  recommendation: Recommendation | null;
  onApply?: () => void;
}

const ALERT_STYLES: Record<string, string> = {
  info: "bg-primary/10 border-primary/15 text-primary",
  success: "bg-[var(--green)]/10 border-[var(--green)]/15 text-[var(--green)]",
  warn: "bg-[var(--orange)]/10 border-[var(--orange)]/15 text-[var(--orange)]",
  danger: "bg-[var(--red)]/10 border-[var(--red)]/15 text-[var(--red)]",
};

export function RecommendationAlert({
  recommendation,
  onApply,
}: RecommendationAlertProps) {
  if (!recommendation) return null;

  const { msg, tp, reason, act } = recommendation;
  const showButton = act === "+200" || act === "-200";

  return (
    <div className="mb-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
        Analyse
      </div>
      <div
        className={`rounded-xl p-2.5 text-xs leading-relaxed border ${ALERT_STYLES[tp]}`}
      >
        <div className="font-bold text-sm mb-1">{msg}</div>
        <div className="opacity-80">{reason}</div>

        {showButton && onApply && (
          <Button
            onClick={onApply}
            size="sm"
            className="w-full mt-2 min-h-[44px]"
            variant={act === "+200" ? "default" : "destructive"}
          >
            Appliquer {act} kcal
          </Button>
        )}
      </div>
    </div>
  );
}
