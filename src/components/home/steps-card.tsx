"use client";

interface StepsCardProps {
  steps: number;
  goal: number;
}

export function StepsCard({ steps, goal }: StepsCardProps) {
  const percent = goal > 0 ? Math.min((steps / goal) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3 py-2.5 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--orange)] to-[var(--yellow)]" />
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base bg-[var(--orange)]/10">
        🚶
      </div>
      <div className="flex-1">
        <div className="text-base font-bold">{steps.toLocaleString()}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
          Pas ({Math.round(percent)}%)
        </div>
      </div>
    </div>
  );
}
