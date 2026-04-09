"use client";

interface MacroProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  colorClass: string;
}

function MacroCard({ label, value, target, unit = "g", colorClass }: MacroProps) {
  const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl px-1.5 py-2.5 text-center relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t ${colorClass}`} />
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </div>
      <div className="text-base font-bold mt-0.5">
        {Math.round(value)}
        <span className="text-[9px] text-muted-foreground">{unit}</span>
      </div>
      <div className="text-[9px] text-muted-foreground">/{target}{unit}</div>
      <div className="h-1 bg-secondary rounded-full mt-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface MacroRowProps {
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
  targets: { prot: number; gluc: number; lip: number; fib: number };
}

export function MacroRow({ prot, gluc, lip, fib, targets }: MacroRowProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 mb-3.5">
      <MacroCard
        label="Prot"
        value={prot}
        target={targets.prot}
        colorClass="bg-gradient-to-r from-primary to-purple-400"
      />
      <MacroCard
        label="Gluc"
        value={gluc}
        target={targets.gluc}
        colorClass="bg-gradient-to-r from-[var(--green)] to-[var(--cyan)]"
      />
      <MacroCard
        label="Lip"
        value={lip}
        target={targets.lip}
        colorClass="bg-gradient-to-r from-[var(--pink)] to-[var(--red)]"
      />
      <MacroCard
        label="Fib"
        value={fib}
        target={targets.fib}
        colorClass="bg-gradient-to-r from-[var(--brown)] to-[var(--orange)]"
      />
    </div>
  );
}
