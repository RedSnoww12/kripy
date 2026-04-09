"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const percent = target > 0 ? Math.min(consumed / target, 1.5) : 0;
  const remaining = Math.max(0, target - consumed);
  const circumference = 2 * Math.PI * 68;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - Math.min(percent, 1));

  const color =
    percent > 1 ? "var(--red)" : percent > 0.85 ? "var(--orange)" : "var(--green)";

  return (
    <div className="relative flex flex-col items-center py-3.5 mb-3">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
          {/* Background ring */}
          <circle
            cx="75"
            cy="75"
            r="68"
            fill="none"
            stroke="currentColor"
            className="text-secondary"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="75"
            cy="75"
            r="68"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold leading-none tracking-tight font-[family-name:var(--font-jetbrains-mono)]">
            {consumed}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
            kcal
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-muted-foreground tracking-wide">
        {remaining > 0 ? `${remaining} kcal restantes` : `${Math.abs(remaining)} kcal en surplus`}
      </p>
    </div>
  );
}
