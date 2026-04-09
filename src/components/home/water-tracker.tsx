"use client";

interface WaterTrackerProps {
  glasses: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function WaterTracker({ glasses, onAdd, onRemove }: WaterTrackerProps) {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-br from-[var(--cyan)]/5 to-transparent border border-[var(--cyan)]/10 rounded-xl px-3 py-2.5">
      <span className="text-lg">💧</span>
      <div className="flex-1">
        <div className="font-bold text-sm" style={{ color: "var(--cyan)" }}>
          {glasses * 250}ml
        </div>
        <div className="text-[9px] text-muted-foreground">{glasses}/12 verres</div>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={onRemove}
          disabled={glasses <= 0}
          className="w-8 h-8 rounded-lg bg-secondary border border-border text-sm font-bold active:scale-90 transition-transform disabled:opacity-30"
        >
          −
        </button>
        <button
          onClick={onAdd}
          disabled={glasses >= 12}
          className="w-8 h-8 rounded-lg bg-secondary border border-border text-sm font-bold active:scale-90 transition-transform disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
