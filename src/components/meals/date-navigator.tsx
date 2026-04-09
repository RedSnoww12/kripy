"use client";

interface DateNavigatorProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  label: string;
}

export function DateNavigator({ date, onPrev, onNext, label }: DateNavigatorProps) {
  return (
    <div className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2.5 mb-3">
      <button
        onClick={onPrev}
        className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-lg active:scale-90 transition-transform"
      >
        ‹
      </button>
      <div className="text-center">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-[10px] text-muted-foreground">{date}</div>
      </div>
      <button
        onClick={onNext}
        className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-lg active:scale-90 transition-transform"
      >
        ›
      </button>
    </div>
  );
}
